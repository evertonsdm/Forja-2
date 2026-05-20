export interface Demografia {
  id_demo: string;
  descricao: string;
  idade_min: number;
  idade_max: number;
  peso_base: number;
  add_tags: string[];
}

export interface Socioeconomico {
  id_socio: string;
  profissao: string;
  req_tags: string[];
  mult_tags: Record<string, number>;
  peso_base: number;
  add_tags: string[];
}

export interface TagDef {
  tag: string;
  mod_saude: number;
  mod_felicidade: number;
  mod_renda_mensal: number;
}

export interface Estado {
  id_estado: string;
  nome_estado: string;
  peso_base: number;
  add_tags: string[];
}

export interface NomeDef {
  id_nome: string;
  nome: string;
  req_tags: string[];
  peso_base: number;
}

export interface CidadeDef {
  id_cidade: string;
  nome_cidade: string;
  req_tags: string[];
  peso_base: number;
  add_tags: string[];
}

export interface NPC {
  seed: string;
  nome: string;
  idade: number;
  demografia: Demografia;
  estado: Estado;
  cidade?: CidadeDef;
  profissao: string;
  tagsMemoria: Record<string, number>;
  saude: number;
  felicidade: number;
  renda: number;
}
