import { GoogleGenerativeAI } from "@google/generative-ai";

// Tenta pegar a chave do ambiente
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Converte um arquivo para o formato esperado pelo Gemini
 */
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise as string, mimeType: file.type },
  };
}

export async function identificarGradePorFoto(file: File) {
  if (!API_KEY) {
    throw new Error("API Key do Google não configurada (VITE_GOOGLE_API_KEY).");
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Você é um especialista em extração de dados de grades escolares.
      Analise a imagem desta grade de horários. Ela geralmente é uma tabela com dias na horizontal ou vertical.
      
      Extraia cada aula identificando:
      - A MATÉRIA (ex: Matemática, Geografia, Language Lab)
      - O PROFESSOR (ex: Rafael, Kátia, Julio K)
      
      Retorne APENAS um JSON no seguinte formato:
      [
        { "materia": "Nome da Matéria", "professor": "Nome do Professor" },
        ...
      ]
      
      REGRAS CRÍTICAS:
      1. Siga EXATAMENTE a ordem cronológica dos horários (1ª aula, 2ª aula, etc).
      2. Se um campo estiver ilegível, tente o seu melhor ou use "".
      3. Se houver "INTERVALO" ou "ALMOÇO", você pode incluir ou pular, o sistema irá tratar.
      4. NÃO inclua nenhum texto explicativo, apenas o ARRAY JSON.
      5. Se houver mais de uma turma na foto, foque na principal ou na que parece ser o alvo.
    `;

    const imagePart = await fileToGenerativePart(file);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();
    
    // Limpa possíveis marcações de markdown
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Erro no processamento da imagem:", error);
    throw new Error("Não foi possível identificar a grade na imagem. Verifique a qualidade da foto.");
  }
}
