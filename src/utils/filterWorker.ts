// filterWorker.ts
interface NPC {
  seed: string;
  nome: string;
  idade: number;
  descDemo: string;
  idDemo: string;
  genero: string;
  estado: string;
  idEstado: string;
  cidade: string;
  idCidade: string;
  profissao: string;
  tags: string[];
}

let masterList: NPC[] = [];
const genderMap = new Map<string, Set<number>>();
const demographyMap = new Map<string, Set<number>>();
const ageGroupMap = new Map<string, Set<number>>();
const stateMap = new Map<string, Set<number>>();
const cityMap = new Map<string, Set<number>>();
const professionMap = new Map<string, Set<number>>();
const tagMap = new Map<string, Set<number>>();

self.onmessage = (event: MessageEvent) => {
  const { type, list, activeFilters } = event.data;

  if (type === "init") {
    masterList = list || [];
    
    // Clear previous maps
    genderMap.clear();
    demographyMap.clear();
    ageGroupMap.clear();
    stateMap.clear();
    cityMap.clear();
    professionMap.clear();
    tagMap.clear();

    const len = masterList.length;
    for (let i = 0; i < len; i++) {
      const npc = masterList[i];

      // gender
      const g = npc.genero;
      if (g) {
        if (!genderMap.has(g)) genderMap.set(g, new Set());
        genderMap.get(g)!.add(i);
      }

      // demography
      const dDesc = npc.descDemo;
      const dId = npc.idDemo;
      if (dDesc) {
        if (!demographyMap.has(dDesc)) demographyMap.set(dDesc, new Set());
        demographyMap.get(dDesc)!.add(i);
      }
      if (dId && dId !== dDesc) {
        if (!demographyMap.has(dId)) demographyMap.set(dId, new Set());
        demographyMap.get(dId)!.add(i);
      }

      // ageGroup
      const age = npc.idade;
      let bucket = "";
      if (age >= 18 && age <= 29) bucket = "18-29";
      else if (age >= 30 && age <= 49) bucket = "30-49";
      else if (age >= 50 && age <= 69) bucket = "50-69";
      else if (age >= 70) bucket = "70+";
      if (bucket) {
        if (!ageGroupMap.has(bucket)) ageGroupMap.set(bucket, new Set());
        ageGroupMap.get(bucket)!.add(i);
      }

      // state
      const stName = npc.estado;
      const stId = npc.idEstado;
      if (stName) {
        if (!stateMap.has(stName)) stateMap.set(stName, new Set());
        stateMap.get(stName)!.add(i);
      }
      if (stId && stId !== stName) {
        if (!stateMap.has(stId)) stateMap.set(stId, new Set());
        stateMap.get(stId)!.add(i);
      }

      // city
      const ct = npc.cidade;
      if (ct) {
        if (!cityMap.has(ct)) cityMap.set(ct, new Set());
        cityMap.get(ct)!.add(i);
      }

      // profession
      const prof = npc.profissao;
      if (prof) {
        if (!professionMap.has(prof)) professionMap.set(prof, new Set());
        professionMap.get(prof)!.add(i);
      }

      // tags
      if (npc.tags) {
        const tagsLen = npc.tags.length;
        for (let j = 0; j < tagsLen; j++) {
          const t = npc.tags[j];
          if (!tagMap.has(t)) tagMap.set(t, new Set());
          tagMap.get(t)!.add(i);
        }
      }
    }

    // Acknowledge initialization with all indices as default matches
    const allIndices = Array.from({ length: len }, (_, i) => i);
    self.postMessage({ type: "init_done", matchedIndices: allIndices });
  }

  if (type === "filter") {
    const filters = activeFilters || {};
    const hasActiveFilters = Object.keys(filters).length > 0;

    if (!hasActiveFilters) {
      const allIndices = Array.from({ length: masterList.length }, (_, i) => i);
      self.postMessage({ type: "filter_done", matchedIndices: allIndices });
      return;
    }

    const matchSets: Set<number>[] = [];

    if (filters.genero) {
      const s = genderMap.get(filters.genero);
      if (s) matchSets.push(s);
    }
    if (filters.demography) {
      const s = demographyMap.get(filters.demography);
      if (s) matchSets.push(s);
    }
    if (filters.ageGroup) {
      const s = ageGroupMap.get(filters.ageGroup);
      if (s) matchSets.push(s);
    }
    if (filters.state) {
      const s = stateMap.get(filters.state);
      if (s) matchSets.push(s);
    }
    if (filters.city) {
      const s = cityMap.get(filters.city);
      if (s) matchSets.push(s);
    }
    if (filters.profession) {
      const s = professionMap.get(filters.profession);
      if (s) matchSets.push(s);
    }
    if (filters.tag) {
      const s = tagMap.get(filters.tag.toLowerCase());
      if (s) matchSets.push(s);
    }

    if (matchSets.length === 0) {
      const allIndices = Array.from({ length: masterList.length }, (_, i) => i);
      self.postMessage({ type: "filter_done", matchedIndices: allIndices });
      return;
    }

    // Sort matching sets to intersect starting with the smallest set (Set Intersection Optimization!)
    matchSets.sort((a, b) => a.size - b.size);
    const smallestSet = matchSets[0];
    const otherSets = matchSets.slice(1);

    const matches: number[] = [];
    for (const idx of smallestSet) {
      let isMatch = true;
      for (const s of otherSets) {
        if (!s.has(idx)) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        matches.push(idx);
      }
    }

    self.postMessage({ type: "filter_done", matchedIndices: matches });
  }
};
export {};
