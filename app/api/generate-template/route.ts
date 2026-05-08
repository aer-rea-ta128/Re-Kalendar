// app/api/generate-template/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'プロンプトがありません' }, { status: 400 });

    const aiPrompt = `
      あなたはライフログアプリのデータベース設計者です。
      ユーザーの要望：「${prompt}」
      
      この要望を満たすために最適な「ジャンル名」と「記録項目のリスト」を設計し、以下のJSONフォーマットのみで出力してください。
      余計な文章やマークダウンは一切含めないでください。

      【利用可能な項目タイプ (type)】
      - number : 数値（回数、時間、杯数など。単位も設定可能）
      - money_expense : 金額（支出・費用）
      - money_income : 金額（収入）
      - score : 対戦スコア（スポーツなど）
      - text : 長文テキスト（セットリスト、感想、日記、メモなど）

      【出力JSONフォーマット】
      {
        "name": "ジャンル名（例：🎤 ライブ遠征記録）",
        "color": "#カラーコード（要望のイメージに合うHEXカラー）",
        "fields": [
          { "name": "項目名（例：セットリスト）", "type": "text" },
          { "name": "項目名（例：グッズ代）", "type": "money_expense" },
          { "name": "項目名（例：公演時間）", "type": "number", "unit": "時間" }
        ]
      }
    `;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(aiPrompt);
    const responseText = result.response.text().trim();
    
    const cleanJsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const templateData = JSON.parse(cleanJsonStr);

    // IDを付与して返す
    templateData.fields = templateData.fields.map((f: any) => ({
      ...f,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9)
    }));

    return NextResponse.json(templateData);

  } catch (error) {
    console.error('AIテンプレート生成エラー:', error);
    return NextResponse.json({ error: '生成に失敗しました' }, { status: 500 });
  }
}