import { Demografia, Socioeconomico, TagDef, Estado, NomeDef, CidadeDef } from "../types";

export const defaultEstado: Estado[] = [
  {
    id_estado: "EST_SP",
    nome_estado: "São Paulo",
    peso_base: 218,
    add_tags: ["Regiao_Sudeste", "Metropole", "Custo_Vida_Alto"]
  },
  {
    id_estado: "EST_MG",
    nome_estado: "Minas Gerais",
    peso_base: 101,
    add_tags: ["Regiao_Sudeste", "Interior", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_RJ",
    nome_estado: "Rio de Janeiro",
    peso_base: 80,
    add_tags: ["Regiao_Sudeste", "Metropole", "Litoral", "Custo_Vida_Alto"]
  },
  {
    id_estado: "EST_BA",
    nome_estado: "Bahia",
    peso_base: 70,
    add_tags: ["Regiao_Nordeste", "Litoral", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_PR",
    nome_estado: "Paraná",
    peso_base: 55,
    add_tags: ["Regiao_Sul", "Clima_Frio", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_RS",
    nome_estado: "Rio Grande do Sul",
    peso_base: 50,
    add_tags: ["Regiao_Sul", "Clima_Frio", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_PE",
    nome_estado: "Pernambuco",
    peso_base: 44,
    add_tags: ["Regiao_Nordeste", "Litoral", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_CE",
    nome_estado: "Ceará",
    peso_base: 43,
    add_tags: ["Regiao_Nordeste", "Litoral", "Sertao_Forte"]
  },
  {
    id_estado: "EST_PA",
    nome_estado: "Pará",
    peso_base: 41,
    add_tags: ["Regiao_Norte", "Origem_Amazonia", "Floresta_Forte"]
  },
  {
    id_estado: "EST_SC",
    nome_estado: "Santa Catarina",
    peso_base: 36,
    add_tags: ["Regiao_Sul", "Clima_Frio", "Litoral"]
  },
  {
    id_estado: "EST_GO",
    nome_estado: "Goiás",
    peso_base: 34,
    add_tags: ["Regiao_CentroOeste", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_MA",
    nome_estado: "Maranhão",
    peso_base: 33,
    add_tags: ["Regiao_Nordeste", "Litoral", "Sertao_Forte"]
  },
  {
    id_estado: "EST_AM",
    nome_estado: "Amazonas",
    peso_base: 19,
    add_tags: ["Regiao_Norte", "Origem_Amazonia", "Floresta_Forte"]
  },
  {
    id_estado: "EST_ES",
    nome_estado: "Espírito Santo",
    peso_base: 18,
    add_tags: ["Regiao_Sudeste", "Litoral", "Custo_Vida_Medio"]
  },
  {
    id_estado: "EST_PB",
    nome_estado: "Paraíba",
    peso_base: 18,
    add_tags: ["Regiao_Nordeste", "Litoral"]
  },
  {
    id_estado: "EST_MT",
    nome_estado: "Mato Grosso",
    peso_base: 17,
    add_tags: ["Regiao_CentroOeste", "Agro_Forte"]
  },
  {
    id_estado: "EST_RN",
    nome_estado: "Rio Grande do Norte",
    peso_base: 16,
    add_tags: ["Regiao_Nordeste", "Litoral"]
  },
  {
    id_estado: "EST_AL",
    nome_estado: "Alagoas",
    peso_base: 15,
    add_tags: ["Regiao_Nordeste", "Litoral"]
  },
  {
    id_estado: "EST_PI",
    nome_estado: "Piauí",
    peso_base: 15,
    add_tags: ["Regiao_Nordeste", "Sertao_Forte"]
  },
  {
    id_estado: "EST_DF",
    nome_estado: "Distrito Federal",
    peso_base: 14,
    add_tags: ["Regiao_CentroOeste", "Metropole", "Custo_Vida_Alto"]
  },
  {
    id_estado: "EST_MS",
    nome_estado: "Mato Grosso do Sul",
    peso_base: 13,
    add_tags: ["Regiao_CentroOeste", "Agro_Forte"]
  },
  {
    id_estado: "EST_SE",
    nome_estado: "Sergipe",
    peso_base: 11,
    add_tags: ["Regiao_Nordeste", "Litoral"]
  },
  {
    id_estado: "EST_RO",
    nome_estado: "Rondônia",
    peso_base: 8,
    add_tags: ["Regiao_Norte", "Origem_Amazonia"]
  },
  {
    id_estado: "EST_TO",
    nome_estado: "Tocantins",
    peso_base: 7,
    add_tags: ["Regiao_Norte", "Origem_Amazonia"]
  },
  {
    id_estado: "EST_AC",
    nome_estado: "Acre",
    peso_base: 4,
    add_tags: ["Regiao_Norte", "Origem_Amazonia"]
  },
  {
    id_estado: "EST_AP",
    nome_estado: "Amapá",
    peso_base: 4,
    add_tags: ["Regiao_Norte", "Origem_Amazonia", "Floresta_Forte"]
  },
  {
    id_estado: "EST_RR",
    nome_estado: "Roraima",
    peso_base: 3,
    add_tags: ["Regiao_Norte", "Origem_Amazonia"]
  }
];

export const defaultNome: NomeDef[] = [];

export const defaultDemografia: Demografia[] = [
  {
    id_demo: "DEM_01",
    descricao: "Adolescente Masculino",
    idade_min: 15,
    idade_max: 17,
    peso_base: 20,
    add_tags: ["Homem", "Jovem", "Dependente"]
  },
  {
    id_demo: "DEM_02",
    descricao: "Adulto Pleno Feminino",
    idade_min: 26,
    idade_max: 45,
    peso_base: 40,
    add_tags: ["Mulher", "Adulto", "Independente"]
  },
  {
    id_demo: "DEM_03",
    descricao: "Sênior Masculino",
    idade_min: 46,
    idade_max: 65,
    peso_base: 25,
    add_tags: ["Homem", "Idoso", "Independente"]
  },
  {
    id_demo: "DEM_04",
    descricao: "Adulto Jovem Masculino",
    idade_min: 18,
    idade_max: 25,
    peso_base: 30,
    add_tags: ["Homem", "Adulto_Jovem", "Independente"]
  },
  {
    id_demo: "DEM_05",
    descricao: "Adulto Pleno Masculino",
    idade_min: 26,
    idade_max: 45,
    peso_base: 40,
    add_tags: ["Homem", "Adulto", "Independente"]
  },
  {
    id_demo: "DEM_06",
    descricao: "Sênior Feminino",
    idade_min: 46,
    idade_max: 65,
    peso_base: 25,
    add_tags: ["Mulher", "Idoso", "Independente"]
  }
];

export const defaultSocioeconomico: Socioeconomico[] = [
  {
    id_socio: "PROF_01",
    profissao: "Advogado Corporativo",
    req_tags: ["Adulto"],
    mult_tags: { "Metropole": 2.0 },
    peso_base: 15,
    add_tags: ["Classe_Alta", "Rotina_Estressante"]
  },
  {
    id_socio: "PROF_02",
    profissao: "Agricultor",
    req_tags: ["Interior"],
    mult_tags: { "UF_MT": 1.5 },
    peso_base: 40,
    add_tags: ["Classe_Media", "Vida_Pacata"]
  },
  {
    id_socio: "PROF_03",
    profissao: "Vendedor Ambulante",
    req_tags: [],
    mult_tags: { "Caos_Urbano": 2.0 },
    peso_base: 35,
    add_tags: ["Classe_Baixa", "Risco_Acidente"]
  }
];

export const defaultTagDef: TagDef[] = [
  { tag: "Idoso", mod_saude: -20, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Classe_Baixa", mod_saude: -5, mod_felicidade: -10, mod_renda_mensal: 1800 },
  { tag: "Risco_Acidente", mod_saude: -10, mod_felicidade: -5, mod_renda_mensal: 0 },
  { tag: "Rotina_Estressante", mod_saude: -15, mod_felicidade: -20, mod_renda_mensal: 0 },
  { tag: "Saude_Forte", mod_saude: 25, mod_felicidade: 10, mod_renda_mensal: 0 },
  { tag: "Classe_Alta", mod_saude: 10, mod_felicidade: 10, mod_renda_mensal: 25000 },
  { tag: "Sem_Renda", mod_saude: 0, mod_felicidade: -5, mod_renda_mensal: 0 },
  { tag: "Homem", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Mulher", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Jovem", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Adulto", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Adulto_Jovem", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Dependente", mod_saude: 0, mod_felicidade: 15, mod_renda_mensal: 0 },
  { tag: "Independente", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Rotina_Leve", mod_saude: 10, mod_felicidade: 20, mod_renda_mensal: 0 },
  { tag: "Regiao_Sudeste", mod_saude: 0, mod_felicidade: 5, mod_renda_mensal: 0 },
  { tag: "Metropole", mod_saude: -5, mod_felicidade: -5, mod_renda_mensal: 1000 },
  { tag: "Custo_Vida_Alto", mod_saude: 0, mod_felicidade: -10, mod_renda_mensal: -500 },
  { tag: "Regiao_Nordeste", mod_saude: 5, mod_felicidade: 15, mod_renda_mensal: 0 },
  { tag: "Litoral", mod_saude: 10, mod_felicidade: 15, mod_renda_mensal: 0 },
  { tag: "Regiao_Norte", mod_saude: 5, mod_felicidade: 5, mod_renda_mensal: 0 },
  { tag: "Origem_Amazonia", mod_saude: 15, mod_felicidade: 10, mod_renda_mensal: 0 },
  { tag: "Floresta_Forte", mod_saude: 20, mod_felicidade: 20, mod_renda_mensal: 0 },
  { tag: "Regiao_Sul", mod_saude: -5, mod_felicidade: 5, mod_renda_mensal: 500 },
  { tag: "Clima_Frio", mod_saude: 5, mod_felicidade: -5, mod_renda_mensal: 0 },
  { tag: "Regiao_CentroOeste", mod_saude: 0, mod_felicidade: 5, mod_renda_mensal: 200 },
  { tag: "Interior", mod_saude: 10, mod_felicidade: 5, mod_renda_mensal: -300 },
  { tag: "Custo_Vida_Medio", mod_saude: 0, mod_felicidade: 0, mod_renda_mensal: 0 },
  { tag: "Sertao_Forte", mod_saude: -5, mod_felicidade: 10, mod_renda_mensal: -200 },
  { tag: "Agro_Forte", mod_saude: 5, mod_felicidade: 5, mod_renda_mensal: 1200 }
];

export const defaultCidade: CidadeDef[] = [
  {
    id_cidade: "CID_SAO_PAULO",
    nome_cidade: "São Paulo",
    req_tags: ["EST_SP"],
    peso_base: 100,
    add_tags: ["Metropole", "Custo_Vida_Alto"]
  },
  {
    id_cidade: "CID_CAMPINAS",
    nome_cidade: "Campinas",
    req_tags: ["EST_SP"],
    peso_base: 60,
    add_tags: ["Interior", "Custo_Vida_Medio"]
  },
  {
    id_cidade: "CID_RIO_DE_JANEIRO",
    nome_cidade: "Rio de Janeiro",
    req_tags: ["EST_RJ"],
    peso_base: 100,
    add_tags: ["Metropole", "Litoral", "Custo_Vida_Alto"]
  },
  {
    id_cidade: "CID_ANGRA",
    nome_cidade: "Angra dos Reis",
    req_tags: ["EST_RJ"],
    peso_base: 40,
    add_tags: ["Litoral", "Custo_Vida_Medio"]
  },
  {
    id_cidade: "CID_SALVADOR",
    nome_cidade: "Salvador",
    req_tags: ["EST_BA"],
    peso_base: 80,
    add_tags: ["Metropole", "Litoral", "Custo_Vida_Medio"]
  },
  {
    id_cidade: "CID_CURITIBA",
    nome_cidade: "Curitiba",
    req_tags: ["EST_PR"],
    peso_base: 70,
    add_tags: ["Metropole", "Clima_Frio", "Custo_Vida_Medio"]
  },
  {
    id_cidade: "CID_MANAUS",
    nome_cidade: "Manaus",
    req_tags: ["EST_PA"], // falling back to Pará or standard reqs
    peso_base: 60,
    add_tags: ["Metropole", "Origem_Amazonia", "Floresta_Forte"]
  }
];
