require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false
});

async function fixAllConstraints() {
    try {
        console.log('=== Finding ALL Foreign Key Constraints Referencing "Users" ===\n');

        // Find all constraints referencing "Users" (PascalCase - incorrect)
        const [badConstraints] = await sequelize.query(`
            SELECT
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            AND (ccu.table_name = 'Users' OR ccu.table_name = 'Farms' OR ccu.table_name LIKE '%[A-Z]%')
        `);

        console.log(`Found ${badConstraints.length} potentially bad constraints\n`);

        // Also get ALL FK constraints to analyze
        const [allConstraints] = await sequelize.query(`
            SELECT
                tc.table_name,
                tc.constraint_name,
                kcu.column_name,
                ccu.table_name AS foreign_table_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name
        `);

        console.log('=== ALL Foreign Key Constraints ===\n');
        const problematic = [];

        for (const c of allConstraints) {
            const isProblematic = c.foreign_table_name !== c.foreign_table_name.toLowerCase();
            const status = isProblematic ? '❌ BAD' : '✅ OK';
            console.log(`${status} ${c.table_name}.${c.column_name} -> ${c.foreign_table_name}`);

            if (isProblematic) {
                problematic.push(c);
            }
        }

        console.log(`\n=== Fixing ${problematic.length} Problematic Constraints ===\n`);

        for (const c of problematic) {
            const correctTable = c.foreign_table_name.toLowerCase();

            try {
                // Drop the bad constraint
                await sequelize.query(`ALTER TABLE "${c.table_name}" DROP CONSTRAINT IF EXISTS "${c.constraint_name}"`);
                console.log(`✓ Dropped: ${c.constraint_name}`);

                // Add correct constraint
                await sequelize.query(`
                    ALTER TABLE "${c.table_name}" 
                    ADD CONSTRAINT "${c.constraint_name}" 
                    FOREIGN KEY ("${c.column_name}") 
                    REFERENCES "${correctTable}"(id) 
                    ON DELETE SET NULL
                `);
                console.log(`✓ Added: ${c.constraint_name} -> ${correctTable}`);
            } catch (e) {
                console.log(`⚠ Error fixing ${c.constraint_name}: ${e.message}`);
            }
        }

        console.log('\n=== Done! ===\n');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await sequelize.close();
    }
}

fixAllConstraints();
