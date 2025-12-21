
export function cleanAIResponse(text){
    
  return text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .replace(/\n/g,"")
    .trim();


}