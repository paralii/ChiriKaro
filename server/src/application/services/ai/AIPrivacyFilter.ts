export class AIPrivacyFilter {
  cleanText(value: string, maxLength = 1200): string {
    return value.split("").filter((character) => { const code = character.charCodeAt(0); return code >= 32 || code === 9 || code === 10 || code === 13; }).join("").replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  redact(text: string, patientName: string): string {
    let result = text;
    const name = patientName.trim();
    if (name.length >= 2) result = result.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "the patient");
    return result.replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted]")
      .replace(/\b(?:\+?\d[\d ()-]{7,}\d)\b/g, "[redacted]")
      .replace(/\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}[/.]\d{1,2}[/.]\d{2,4})\b/g, "[date omitted]")
      .replace(/\b\d{1,6}\s+[\p{L}0-9.'-]+(?:\s+[\p{L}0-9.'-]+){0,4}\s+(?:street|st\.?|road|rd\.?|avenue|ave\.?|lane|ln\.?|drive|dr\.?|boulevard|blvd\.?|court|ct\.?|way)\b/giu, "[address omitted]")
      .replace(/\b(?:my name is|patient named|contact(?: person)? is|name:)\s+[\p{L}][\p{L}'-]*(?:\s+[\p{L}][\p{L}'-]*){0,2}/giu, "[personal detail omitted]")
      .replace(/\b[0-9a-f]{24}\b/gi, "[identifier omitted]");
  }
}
