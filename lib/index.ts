import * as ast from './astsql';
import { QueryBuilder } from './queryBuilder';

let qb = new QueryBuilder();
let a = qb.select("*");
