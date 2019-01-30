/* eslint-disable no-console, spaced-comment */
const fs = require('fs');
const connectionManager = require('./db/connection_manager');

const drops = require('./init_sql/drops');
const initPostgis = require('./init_sql/init_postgis');
const initAssets = require('./init_sql/assets');
const initLocations = require('./init_sql/locations');
const initDepends = require('./init_sql/depends');
const initFiles = require('./init_sql/files');
const initEtlTasks = require('./init_sql/etl_tasks');
const initObjects = require('./init_sql/objects');
const initObjectCreateScripts = require('./init_sql/object_create_scripts');
const initObjectBlueprints = require('./init_sql/object_blueprints');
const initObjectBlueprintColumns = require('./init_sql/object_blueprint_columns');

const locations = require('./init_sql/table_locations');

async function dbInit(args) {
  const dbConfigFile = args.getArg(0);
  console.log(`Options ${JSON.stringify(args.options)}`);
  if (dbConfigFile === null) {
    console.log('Usage: bedrock [--postgis] initdb db-config-file-name');
    process.exit();
  }
  if (!fs.existsSync(dbConfigFile)) {
    console.log(`Database configuration file ${dbConfigFile} not found`);
    process.exit();
  }

  const fd = fs.openSync(dbConfigFile, 'r');
  const dbConfig = JSON.parse(fs.readFileSync(fd, { encoding: 'utf8' }));
  fs.closeSync(fd);

  const client = connectionManager.addConnection('New Bedrock Database', dbConfig);

  console.log(`Here is the db config: ${JSON.stringify(dbConfig)}`);

  const runPostgis = (args.hasOption('postgis')) ? client.query(initPostgis) : Promise.resolve(null);

  await runPostgis
    .then(r => {
      if (r !== null) console.log('Installed postgis');
      return client.query(drops);
    })
    .then(() => {
      console.log('Dropped all previous');
      return client.query('CREATE SCHEMA bedrock;');
    })
    .then(() => {
      console.log('Initialized the schema');
      return client.query(initLocations);
    })
    .then(() => {
      const keys = Object.keys(locations);
      const cmd = 'INSERT INTO bedrock.asset_locations (name, short_name, active, type, description) VALUES ';
      const q = keys.reduce((accum, key, idx) => {
        const append = (idx === keys.length - 1) ? '' : ', ';
        const item = locations[key];
        return `${accum} ('${item.name}', '${key}', ${item.active}, '${item.type}', '${item.description}')${append}`;
      }, cmd);
      return client.query(q);
    })
    .then(() => {
      console.log('Initialized the locations');
      return client.query(initAssets);
    })
    .then(() => {
      console.log('Initialized the assets table');
      return client.query(initDepends);
    })
    .then(() => {
      console.log('Initialized the depends table');
      return client.query(initFiles);
    })
    .then(() => {
      console.log('Initialized the asset_files table');
      return client.query(initEtlTasks);
    })
    .then(() => {
      console.log('Initialized the ETL tasks');
      return client.query(initObjects);
    })
    .then(() => {
      console.log('Initialized asset objects');
      return client.query(initObjectCreateScripts);
    })
    .then(() => {
      console.log('Initialized asset object scripts');
      return client.query(initObjectBlueprints);
    })
    .then(() => {
      console.log('Initialized asset object definitions');
      return client.query(initObjectBlueprintColumns);
    })
    .then(() => {
      console.log('Initialized asset object definition columns');
      console.log('Now done');
      return Promise.resolve(null);
    })
    .catch(err => {
      console.log(`Got an error: ${err}!`);
      return Promise.resolve(null);
    });

  console.log('All done');
}

module.exports = dbInit;
