# ts-sql

[![Build Status](https://travis-ci.org/solzacode/ts-sql.svg?branch=master)](https://travis-ci.org/solzacode/ts-sql)
[![NPM version](https://badge.fury.io/js/ts-sql.svg)](https://www.npmjs.com/package/ts-sql)
[![Coverage Status](https://coveralls.io/repos/github/solzacode/ts-sql/badge.svg?branch=master)](https://coveralls.io/github/solzacode/ts-sql?branch=master)

SQL builder, AST and code generator in TypeScript. This project is heavily inspired by [XQL](https://github.com/exjs/xql). A big shout out to [@exjs](https://github.com/exjs) and [@kobalicek](https://github.com/kobalicek) for this amazing project.

## Acknowledgements

1. Grammar referenced from [here](https://github.com/antlr/grammars-v4/tree/master/mysql).
2. Project inspired from [XQL](https://github.com/exjs/xql).

## Motivation

The primary use case that prompted me to start this project is to be able to transform a given query that uses a set of tables/columns to one that uses a different set of tables and columns based on a mapping. For e.g. you should be able to transform the following query:

```sql
SELECT t.field_1 FROM table_1 AS t
```

to the following query:

```sql
SELECT t.userId FROM user AS t
```

The following tools are available as part of this project:

1. Abstract Syntax Tree - a set of classes and types that describes the SQL statements as per the language syntax.
2. SQL Builder - an API that allows the users to build SQL statements using code and directly in the form of AST.
3. SQL Compiler - a SQL compiler that generates SQL query based on the AST.

## Beta

This project is currently in a beta stage and will continue to be until most of the features are built out.

## Introduction

ts-sql is designed to build SQL programmatically and generate an AST. You can customize the AST programmatically. The AST will also support serialization to/from JSON. The AST can be compiled into a SQL query using query builders. Initially ts-sql will come with a MySQL builder. Other builders will be added as needed.

## Installation

```sh
npm install ts-sql --save
yarn add ts-sql
```

## Usage

It is highly recommended that you use this package with TypeScript in order to fully leverage the type safety and type guards available in the AST and the builder. You can use the API as follows:

```typescript
let qb = new MySQLQueryBuilder();
let query = qb.select("*").from("accounts").build();
let qc = new MySQLQueryCompiler();

console.log(qc.compile(query));

// Output
// SELECT * FROM accounts

```
