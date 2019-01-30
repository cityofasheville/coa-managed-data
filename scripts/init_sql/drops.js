module.exports = `
DROP TABLE IF EXISTS bedrock.object_blueprint_columns;
DROP TABLE IF EXISTS bedrock.object_blueprints;
DROP TABLE IF EXISTS bedrock.asset_object_create_scripts;
DROP TABLE IF EXISTS bedrock.asset_objects;
DROP SEQUENCE IF EXISTS bedrock.asset_object_id_seq;
DROP TABLE IF EXISTS bedrock.etl_tasks;
DROP SEQUENCE IF EXISTS bedrock.etl_task_id_seq;
DROP TABLE IF EXISTS bedrock.asset_files;
DROP SEQUENCE IF EXISTS bedrock.asset_files_id_seq;
DROP TABLE IF EXISTS bedrock.asset_depends;
DROP SEQUENCE IF EXISTS bedrock.asset_depend_id_seq;
DROP TABLE IF EXISTS bedrock.assets;
DROP SEQUENCE IF EXISTS bedrock.asset_id_seq;
DROP TABLE IF EXISTS bedrock.asset_locations;
DROP SEQUENCE IF EXISTS bedrock.asset_location_id_seq;
DROP SCHEMA IF EXISTS bedrock; 
`;
