-- Criação das tabelas para armazenar dados dos métodos getAfdRt* no SQLite
CREATE TABLE IF NOT EXISTS afd_rt_punches (
  dtaBatida TEXT,
  hora TEXT,
  qtdRows INTEGER,
  minBatida TEXT,
  maxBatida TEXT
);

CREATE TABLE IF NOT EXISTS afd_rt_nro_punches (
  nroBatidas TEXT,
  colaboradores INTEGER
);

CREATE TABLE IF NOT EXISTS afd_rt_lj_punches (
  loja TEXT,
  qtdRelogios INTEGER,
  qtdBatidas INTEGER,
  dtaBatida TEXT,
  minBatida TEXT,
  maxBatida TEXT
);

CREATE TABLE IF NOT EXISTS afd_rt_all_punches (
  dtaMes TEXT,
  qtdBatidas INTEGER
);
