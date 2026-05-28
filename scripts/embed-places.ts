import { supabaseAdmin } from '../lib/supabase/admin';
import { embed } from '../lib/ai/embedding/gateway';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({ minTime: 3000 }); // HF Free tier limit rate: 1 req / 3 sec

async function embedAllPlaces() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Embed Script] Supabase environment variables not found. Skipping embedding execution.');
    return;
  }

  const langs = ['en', 'ja', 'zh-Hans'];
  console.log('Starting batch place embedding pipeline...');

  for (const lang of langs) {
    console.log(`Processing language: ${lang}`);
    
    // Fetch places having corresponding translation records
    const { data: places, error } = await supabaseAdmin
      .from('places')
      .select('place_id, name_ko, place_i18n!inner(name, short_desc, lang)')
      .eq('place_i18n.lang', lang);
    
    if (error) {
      console.error(`Error fetching places for lang ${lang}:`, error);
      continue;
    }

    console.log(`Found ${places?.length || 0} places for ${lang}`);
    
    for (const place of places ?? []) {
      const i18nList = place.place_i18n as unknown as any[];
      const i18n = Array.isArray(i18nList) ? i18nList[0] : i18nList;
      if (!i18n) continue;
      
      const text = `${i18n.name}. ${i18n.short_desc ?? ''}`;
      console.log(`Embedding [${place.name_ko}] (${lang}): "${text.substring(0, 30)}..."`);
      
      try {
        const { vectors, modelName } = await limiter.schedule(() => 
          embed({ texts: [text], type: 'passage' })
        );
        
        const { error: upsertError } = await supabaseAdmin.from('embeddings').upsert({
          entity_type: 'PLACE',
          entity_id: place.place_id,
          lang,
          vector: vectors[0],
          model_name: modelName,
        });

        if (upsertError) {
          console.error(`Failed to upsert embedding for ${place.place_id}:`, upsertError);
        } else {
          console.log(`Successfully embedded place_id: ${place.place_id}`);
        }
      } catch (err: any) {
        console.error(`Failed to request embedding for ${place.place_id}:`, err.message);
      }
    }
  }
}

embedAllPlaces()
  .then(() => console.log('Batch embedding pipeline finished.'))
  .catch((err) => console.error('Batch embedding process failed:', err));
