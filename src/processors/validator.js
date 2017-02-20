const fs = require('fs');
const Pool = require('pg-pool');
const pgMetadata = require('pg-metadata');

let localPool = null;

function verifyType(def, actual) {
  let error = null;
  switch (actual.type) {
    case 'varchar':
      if (def.type !== `varchar(${actual.length})`) {
        error = `Bad type ${actual.type}(${actual.length}) vs ${def.type}`;
      }
      break;
    case 'int4':
      if (def.type !== 'integer') {
        error = `Bad type ${actual.type} - should be ${def.type}`;
      }
      break;
    case 'int8':
      if (def.type !== 'bigint') {
        error = `Bad type ${actual.type} - should be ${def.type}`;
      }
      break;
    case 'numeric':
      if (def.type !== `numeric(${actual.precision},${actual.scale})`) {
        error = `Numeric(${actual.precision},${actual.scale}), should be ${def.type}`;
      }
      break;
    case 'timestamp':
      if (def.type !== 'timestamp-no-tz') {
        error = `Type is timestamp, should be ${def.type}`;
      }
      break;
    default:
      // Default catches text, geometry
      if (def.type !== actual.type) {
        error = `Unknown type: ${actual.type}, length ${actual.length} - should be ${def.type}`;
      }
      break;
  }
  return error;
}

//
// Set up DB connection
//
function init() {
  const dbConfig = {
    host: process.env.dbhost,
    user: process.env.dbuser,
    password: process.env.dbpassword,
    database: process.env.database,
    max: 10,
    idleTimeoutMillis: 10000,
  //  ssl: true,
  };

  if (localPool == null) {
    localPool = new Pool(dbConfig);
  }
}

function finish() {
  localPool.end();
}

function validate(metadata, logger, config, ds, ddef) {
  if (metadata && metadata[config.db] && metadata[config.db][ds.schema]) {
    const columns = metadata[config.db][ds.schema][ds.table];
    const checkColumns = {};
    Object.getOwnPropertyNames(columns).forEach((colName) => {
      checkColumns[colName] = false;
    });

    ds.columns.forEach((cDef) => {
      if (!(cDef.column in columns)) {
        logger.error('table-missing-column',
         `Required column ${cDef.column} not found in table ${ds.table}`,
         { table: ds.table, column: cDef.column });
      } else {
        checkColumns[cDef.column] = true;
        const typeErr = verifyType(cDef, columns[cDef.column]);
        if (typeErr) {
          logger.error('column-type-err',
            `Types error in column ${cDef.column} of table ${ds.table}: ${typeErr}`,
            { table: ds.table, column: cDef.column, message: typeErr });
        }
      }
    });
    Object.getOwnPropertyNames(checkColumns).forEach((colName) => {
      if (!checkColumns[colName]) {
        logger.error('definition-missing-column',
          `Column ${colName}, table ${ddef.table} is missing from definition`,
          { table: ddef.table, column: colName });
      }
    });
  }
}

function run(pool, path, config, logger) {
  const fd = fs.openSync(`${path}/mda.json`, 'r');
  const ddef = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' }));
  // if (ddef.datasets.length > 0) {
  //   console.log(`Processing ${path}, datasets: ${JSON.stringify(tables)}`);
  // }
  ddef.datasets.forEach((ds) => {
    pool.connect().then((client) => {
      const query = pgMetadata.createQuery({ table: ds.table });
      client.query(query).then((result) => {
        client.release();
        if (result.rows.length > 0) {
          const schema = pgMetadata.createMetadataObject(result.rows);
          validate(schema, logger, config, ds, ddef);
        } else {
          logger.error('missing-table', `Table  ${ds.table} does not exist`, { path, table: ds.table });
        }
      }).catch((err) => {
        client.release();
        logger.error('query-error',
          `Query error on table ${ds.table}: ${err.message}`,
          { path, table: ds.table, err });
      });
    }).catch((err) => {
      logger.error('connection-error',
        `Connection error on table ${ds.table}: ${err.message}`,
        { path, table: ds.table, err });
    });
  });
}

function processing(stage, path, dest, config, logger) {
  const pool = localPool;
  switch (stage) {
    case 'init':
      init();
      break;
    case 'run':
      run(pool, path, config, logger);
      break;
    case 'finish':
      finish();
      break;
    default:
      break;
  }
}
module.exports = processing;
