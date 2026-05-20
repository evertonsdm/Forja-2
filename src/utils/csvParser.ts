import { NomeDef, CidadeDef, Demografia, Estado, TagDef } from "../types";

/**
 * Parses a standard RFC 4180 CSV string into a NomeDef list.
 * This parser correctly handles comma-separated fields, quoted text fields that may contain commas, Ensure weights are numeric.
 */
export function parseNomesCSV(csvText: string): NomeDef[] {
  const result: NomeDef[] = [];
  if (!csvText || csvText.trim() === "") return result;

  // Split lines safely considering both \n and \r\n
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++; // skip \n of \r\n
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result; // No data, only header or empty

  // Auto-detect separators (comma vs semicolon)
  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
        // Do not add the surrounding quotes to field
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxId = headerFields.indexOf("id_nome");
  const idxNome = headerFields.indexOf("nome");
  const idxPeso = headerFields.indexOf("peso_base");
  const idxReqTags = headerFields.indexOf("req_tags");

  // Fallback map if exact index matches fail due to minor spaces or Portuguese labels
  const getFieldIndex = (keys: string[], defaultIdx: number): number => {
    for (const k of keys) {
      const found = headerFields.findIndex(h => h === k || h.includes(k));
      if (found !== -1) return found;
    }
    return defaultIdx;
  };

  const finalIdxId = idxId !== -1 ? idxId : getFieldIndex(["id_nome", "id"], 0);
  const finalIdxNome = idxNome !== -1 ? idxNome : getFieldIndex(["nome", "name"], 1);
  const finalIdxPeso = idxPeso !== -1 ? idxPeso : getFieldIndex(["peso_base", "peso", "weight"], 2);
  const finalIdxReqTags = idxReqTags !== -1 ? idxReqTags : getFieldIndex(["req_tags", "req", "tags"], 3);

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const idVal = cells[finalIdxId] || `NOM_CSV_${i}`;
    const nomeVal = cells[finalIdxNome] || "";
    
    if (!nomeVal) continue; // Skip lines without a name

    const pesoValRaw = cells[finalIdxPeso] || "50";
    const pesoVal = parseFloat(pesoValRaw.replace(",", ".")) || 50;

    const reqTagsRaw = cells[finalIdxReqTags] || "";
    let reqTags: string[] = [];
    if (reqTagsRaw) {
      // Tags might be separated by commas, semicolons or spaces
      reqTags = reqTagsRaw
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "[]" && t !== "none" && t !== "null");
    }

    result.push({
      id_nome: idVal,
      nome: nomeVal,
      peso_base: pesoVal,
      req_tags: reqTags
    });
  }

  return result;
}

export function parseCidadesCSV(csvText: string): CidadeDef[] {
  const result: CidadeDef[] = [];
  if (!csvText || csvText.trim() === "") return result;

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result;

  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxId = headerFields.indexOf("id_cidade");
  const idxNome = headerFields.indexOf("nome_cidade");
  const idxPeso = headerFields.indexOf("peso_base");
  const idxReqTags = headerFields.indexOf("req_tags");
  const idxAddTags = headerFields.indexOf("add_tags");

  const getFieldIndex = (keys: string[], defaultIdx: number): number => {
    for (const k of keys) {
      const found = headerFields.findIndex(h => h === k || h.includes(k));
      if (found !== -1) return found;
    }
    return defaultIdx;
  };

  const finalIdxId = idxId !== -1 ? idxId : getFieldIndex(["id_cidade", "id"], 0);
  const finalIdxNome = idxNome !== -1 ? idxNome : getFieldIndex(["nome_cidade", "nome", "cidade", "city"], 1);
  const finalIdxPeso = idxPeso !== -1 ? idxPeso : getFieldIndex(["peso_base", "peso", "weight"], 2);
  const finalIdxReqTags = idxReqTags !== -1 ? idxReqTags : getFieldIndex(["req_tags", "req", "reqtags"], 3);
  const finalIdxAddTags = idxAddTags !== -1 ? idxAddTags : getFieldIndex(["add_tags", "add", "addtags"], 4);

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const idVal = cells[finalIdxId] || `CID_CSV_${i}`;
    const nomeVal = cells[finalIdxNome] || "";
    
    if (!nomeVal) continue;

    const pesoValRaw = cells[finalIdxPeso] || "50";
    const pesoVal = parseFloat(pesoValRaw.replace(",", ".")) || 50;

    const reqTagsRaw = cells[finalIdxReqTags] || "";
    let reqTags: string[] = [];
    if (reqTagsRaw) {
      reqTags = reqTagsRaw
        .replace(/[\[\]"']/g, "")
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    const addTagsRaw = cells[finalIdxAddTags] || "";
    let addTags: string[] = [];
    if (addTagsRaw) {
      addTags = addTagsRaw
        .replace(/[\[\]"']/g, "")
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    result.push({
      id_cidade: idVal,
      nome_cidade: nomeVal,
      peso_base: pesoVal,
      req_tags: reqTags,
      add_tags: addTags
    });
  }

  return result;
}

export interface RawSocioDef {
  id_socio: string;
  profissao: string;
  req_tags: string[];
  mult_tags: Record<string, number>;
  peso_base: number;
  add_tags: string[];
}

export function parseSocioeconomicoCSV(csvText: string): RawSocioDef[] {
  const result: RawSocioDef[] = [];
  if (!csvText || csvText.trim() === "") return result;

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result;

  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxId = headerFields.findIndex(h => h === "id_prof" || h === "id_socio" || h === "id");
  const idxProfissao = headerFields.findIndex(h => h === "profissao" || h === "profession" || h === "profissão");
  const idxPeso = headerFields.findIndex(h => h === "peso_base" || h === "peso" || h === "weight");
  const idxReqTags = headerFields.findIndex(h => h === "req_tags" || h === "req");
  const idxAddTags = headerFields.findIndex(h => h === "add_tags" || h === "add");
  const idxMultTags = headerFields.findIndex(h => h === "mult_tags" || h === "mult" || h === "multiplicadores");

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const idVal = cells[idxId !== -1 ? idxId : 0] || `SOC_CSV_${i}`;
    const profVal = cells[idxProfissao !== -1 ? idxProfissao : 1] || "";
    
    if (!profVal) continue;

    const pesoValRaw = cells[idxPeso !== -1 ? idxPeso : 4] || "50";
    const pesoVal = parseFloat(pesoValRaw.replace(",", ".")) || 50;

    const reqTagsRaw = cells[idxReqTags !== -1 ? idxReqTags : 2] || "";
    let reqTags: string[] = [];
    if (reqTagsRaw) {
      reqTags = reqTagsRaw
        .replace(/[\[\]"]/g, "") // support both [tag1, tag2] and tag1, tag2
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    const addTagsRaw = cells[idxAddTags !== -1 ? idxAddTags : 5] || "";
    let addTags: string[] = [];
    if (addTagsRaw) {
      addTags = addTagsRaw
        .replace(/[\[\]"]/g, "")
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    const multTagsRaw = cells[idxMultTags !== -1 ? idxMultTags : 3] || "";
    let multTags: Record<string, number> = {};
    if (multTagsRaw) {
      try {
        // Handle JSON string format e.g. {"Metropole": 2.0} or simplified string formatting like Metropole:2.0
        const cleaned = multTagsRaw.trim();
        if (cleaned.startsWith("{")) {
          multTags = JSON.parse(cleaned);
        } else {
          const parts = cleaned.split(/[;,]/);
          for (const part of parts) {
            const sub = part.split(":");
            if (sub.length >= 2) {
              const k = sub[0].trim();
              const v = parseFloat(sub[1].trim());
              if (k && !isNaN(v)) {
                multTags[k] = v;
              }
            }
          }
        }
      } catch (e) {
        console.warn("Failed to parse multiplier:", multTagsRaw, e);
      }
    }

    result.push({
      id_socio: idVal,
      profissao: profVal,
      peso_base: pesoVal,
      req_tags: reqTags,
      add_tags: addTags,
      mult_tags: multTags
    });
  }

  return result;
}

export function parseDemografiaCSV(csvText: string): Demografia[] {
  const result: Demografia[] = [];
  if (!csvText || csvText.trim() === "") return result;

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result;

  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxId = headerFields.indexOf("id_demo");
  const idxDesc = headerFields.indexOf("descricao");
  const idxIdadeMin = headerFields.indexOf("idade_min");
  const idxIdadeMax = headerFields.indexOf("idade_max");
  const idxPeso = headerFields.indexOf("peso_base");
  const idxAddTags = headerFields.indexOf("add_tags");

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const idVal = cells[idxId !== -1 ? idxId : 0] || `DEM_CSV_${i}`;
    const descVal = cells[idxDesc !== -1 ? idxDesc : 1] || "";
    if (!descVal) continue;

    const idMin = parseInt(cells[idxIdadeMin !== -1 ? idxIdadeMin : 2]) || 0;
    const idMax = parseInt(cells[idxIdadeMax !== -1 ? idxIdadeMax : 3]) || 120;
    const pesoVal = parseFloat((cells[idxPeso !== -1 ? idxPeso : 4] || "50").replace(",", ".")) || 50;

    const addTagsRaw = cells[idxAddTags !== -1 ? idxAddTags : 5] || "";
    let addTags: string[] = [];
    if (addTagsRaw) {
      addTags = addTagsRaw
        .replace(/[\[\]"']/g, "")
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    result.push({
      id_demo: idVal,
      descricao: descVal,
      idade_min: idMin,
      idade_max: idMax,
      peso_base: pesoVal,
      add_tags: addTags
    });
  }

  return result;
}

export function parseEstadosCSV(csvText: string): Estado[] {
  const result: Estado[] = [];
  if (!csvText || csvText.trim() === "") return result;

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result;

  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxId = headerFields.indexOf("id_estado");
  const idxNome = headerFields.indexOf("nome_estado");
  const idxPeso = headerFields.indexOf("peso_base");
  const idxAddTags = headerFields.indexOf("add_tags");

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const idVal = cells[idxId !== -1 ? idxId : 0] || `EST_CSV_${i}`;
    const nomeVal = cells[idxNome !== -1 ? idxNome : 1] || "";
    if (!nomeVal) continue;

    const pesoVal = parseFloat((cells[idxPeso !== -1 ? idxPeso : 3] || "50").replace(",", ".")) || 50;

    const addTagsRaw = cells[idxAddTags !== -1 ? idxAddTags : 4] || "";
    let addTags: string[] = [];
    if (addTagsRaw) {
      addTags = addTagsRaw
        .replace(/[\[\]"']/g, "")
        .split(/[,,;]/)
        .map(t => t.trim())
        .filter(t => t.length > 0 && t !== "none" && t !== "null");
    }

    result.push({
      id_estado: idVal,
      nome_estado: nomeVal,
      peso_base: pesoVal,
      add_tags: addTags
    });
  }

  return result;
}

export function parseTagDefCSV(csvText: string): TagDef[] {
  const result: TagDef[] = [];
  if (!csvText || csvText.trim() === "") return result;

  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && csvText[i + 1] === "\n") {
        i++;
      }
      if (currentLine.trim() !== "") {
        lines.push(currentLine);
      }
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim() !== "") {
    lines.push(currentLine);
  }

  if (lines.length <= 1) return result;

  const header = lines[0];
  const separator = header.includes(";") ? ";" : ",";

  const parseCSVRow = (rowText: string): string[] => {
    const fields: string[] = [];
    let field = "";
    let insideStr = false;

    for (let j = 0; j < rowText.length; j++) {
      const c = rowText[j];
      if (c === '"') {
        insideStr = !insideStr;
      } else if (c === separator && !insideStr) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  };

  const headerFields = parseCSVRow(header).map(h => h.toLowerCase().trim());
  const idxTag = headerFields.indexOf("tag");
  const idxSaude = headerFields.indexOf("mod_saude");
  const idxFel = headerFields.indexOf("mod_felicidade");
  const idxRenda = headerFields.indexOf("mod_renda_mensal");

  for (let i = 1; i < lines.length; i++) {
    const rawRow = lines[i];
    if (!rawRow.trim()) continue;

    const cells = parseCSVRow(rawRow);
    const tagVal = cells[idxTag !== -1 ? idxTag : 0] || "";
    if (!tagVal) continue;

    const saudeVal = parseFloat((cells[idxSaude !== -1 ? idxSaude : 1] || "0").replace(",", ".")) || 0;
    const felVal = parseFloat((cells[idxFel !== -1 ? idxFel : 2] || "0").replace(",", ".")) || 0;
    const rendaVal = parseFloat((cells[idxRenda !== -1 ? idxRenda : 3] || "0").replace(",", ".")) || 0;

    result.push({
      tag: tagVal,
      mod_saude: saudeVal,
      mod_felicidade: felVal,
      mod_renda_mensal: rendaVal
    });
  }

  return result;
}
