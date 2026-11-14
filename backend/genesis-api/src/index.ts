// Entrypoint usado pelo deploy zero-config de Express na Vercel (busca por
// app/index/server.ts na raiz ou em src/, exportando o app por padrão em vez
// de chamar `.listen()`). Uso local/tradicional continua em `server.ts`.
import express from 'express';
import { createApp } from './app';

// `pg.Pool` conecta sob demanda a cada query, então não precisa (nem deve,
// nesse formato zero-config) de um passo explícito de "conectar no boot".
void express;

export default createApp();
