/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('transacoes', function(table) {
      table.string('id').primary();
      table.string('description').notNullable();
      table.bigInteger('amount').notNullable(); // Centavos
      table.date('date').notNullable();
      table.string('type').notNullable();
      table.string('category');
      table.string('essentiality');
      table.string('cardId');
      table.string('status');
      table.timestamps(true, true);
    })
    .createTable('cartoes', function(table) {
      table.string('id').primary();
      table.string('name').notNullable();
      table.bigInteger('limit');  // Ajustado para bater com frontend: model.limit
      table.integer('dueDay');    // Ajustado para bater com frontend: model.dueDay
      table.integer('closingDay');// Ajustado para bater com frontend: model.closingDay
      table.string('color');      // Adicionado
      table.string('icon');       // Adicionado
      table.boolean('active');    // Adicionado
      table.timestamps(true, true);
    })
    .createTable('dividas', function(table) {
      table.string('id').primary();
      table.string('description').notNullable();
      table.bigInteger('total_value').notNullable();
      table.integer('paid_months').defaultTo(0);
      table.integer('term_months').notNullable();
      table.decimal('monthly_rate', 10, 4); // Taxa de juros
      table.string('system'); // PRICE, SAC
      table.bigInteger('saldo_devedor_atual');
      table.timestamps(true, true);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('dividas')
    .dropTableIfExists('cartoes')
    .dropTableIfExists('transacoes');
};
