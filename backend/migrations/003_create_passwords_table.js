exports.up = function(knex) {
  return knex.schema.createTable('passwords', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.text('encrypted_data').notNullable();
    table.timestamps(true, true);
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('passwords');
};