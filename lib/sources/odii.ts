// Odii (스마트 관광오디오 가이드) API Client
export class OdiiApiClient {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.DATA_GO_KR_API_KEY || '';
  }

  async getAudioGuideList(params: {
    lang: 'en' | 'ja' | 'zh-Hans' | 'zh-Hant';
    contentId?: string;
  }) {
    console.log(`Calling Odii audio guide list for lang: ${params.lang}`);
    return [];
  }
}
