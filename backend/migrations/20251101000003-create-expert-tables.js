'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        // Create Experts table
        await queryInterface.createTable('experts', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            specializations: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false
            },
            certifications: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            experience: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Years of experience'
            },
            bio: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            languages: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                allowNull: false,
                defaultValue: ['French', 'English']
            },
            hourly_rate: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            commission_rate: {
                type: Sequelize.DECIMAL(4, 2),
                allowNull: false,
                defaultValue: 0.20 // 20% commission
            },
            total_earnings: {
                type: Sequelize.DECIMAL(12, 2),
                allowNull: false,
                defaultValue: 0
            },
            rating: {
                type: Sequelize.DECIMAL(2, 1),
                allowNull: true
            },
            total_consultations: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            completion_rate: {
                type: Sequelize.INTEGER,
                allowNull: true
            },
            avg_response_time: {
                type: Sequelize.DECIMAL(4, 2),
                allowNull: true,
                comment: 'Average response time in hours'
            },
            profile_image: {
                type: Sequelize.STRING,
                allowNull: true
            },
            location: {
                type: Sequelize.JSONB,
                allowNull: false
            },
            availability: {
                type: Sequelize.JSONB,
                allowNull: false,
                defaultValue: {
                    available: true,
                    schedule: {
                        monday: { start: '09:00', end: '17:00' },
                        tuesday: { start: '09:00', end: '17:00' },
                        wednesday: { start: '09:00', end: '17:00' },
                        thursday: { start: '09:00', end: '17:00' },
                        friday: { start: '09:00', end: '17:00' }
                    }
                }
            },
            approval_status: {
                type: Sequelize.ENUM('pending', 'approved', 'rejected'),
                allowNull: false,
                defaultValue: 'pending'
            },
            verification_documents: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            created_by_admin_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            approved_by_admin_id: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            approved_at: {
                type: Sequelize.DATE,
                allowNull: true
            },
            profile_visible: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            last_active: {
                type: Sequelize.DATE,
                allowNull: true
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Create Consultations table
        await queryInterface.createTable('consultations', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            farmer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            expert_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            farm_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Farms',
                    key: 'id'
                }
            },
            crop_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'crops', // from 2025...01
                    key: 'id'
                }
            },
            status: {
                type: Sequelize.ENUM(
                    'pending',
                    'accepted',
                    'in_progress',
                    'completed',
                    'cancelled',
                    'disputed'
                ),
                allowNull: false,
                defaultValue: 'pending'
            },
            consultation_type: {
                type: Sequelize.ENUM('remote', 'on_site'),
                allowNull: false
            },
            scheduled_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            duration: {
                type: Sequelize.INTEGER,
                allowNull: false,
                comment: 'Duration in minutes'
            },
            problem_description: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            attachments: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Array of attachment URLs'
            },
            location: {
                type: Sequelize.JSONB,
                allowNull: true,
                comment: 'Location details for on-site consultations'
            },
            expert_notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            recommendations: {
                type: Sequelize.JSONB,
                allowNull: true
            },
            follow_up_date: {
                type: Sequelize.DATE,
                allowNull: true
            },
            rate: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                comment: 'Rate per hour'
            },
            total_cost: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            commission_rate: {
                type: Sequelize.DECIMAL(4, 2),
                allowNull: false,
                defaultValue: 0.20
            },
            commission_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false,
                defaultValue: 0
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'paid', 'refunded'),
                allowNull: false,
                defaultValue: 'pending'
            },
            refund_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            dispute_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            resolution: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            cancelled_by: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            cancellation_reason: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            extra_notes: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: true,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            feedback: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            // Missing fields from 001 enhancement, might as well add them now if overlapping
            // rated_at was added in 001. Let's include it.
            rated_at: {
                type: Sequelize.DATE
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Create ExpertReviews table
        await queryInterface.createTable('expert_reviews', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            expert_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'experts',
                    key: 'id'
                }
            },
            farmer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            consultation_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'consultations',
                    key: 'id'
                }
            },
            rating: {
                type: Sequelize.INTEGER,
                allowNull: false,
                validate: {
                    min: 1,
                    max: 5
                }
            },
            comment: {
                type: Sequelize.TEXT,
                allowNull: true
            },
            consultation_type: {
                type: Sequelize.ENUM('remote', 'on_site'),
                allowNull: false
            },
            consultation_date: {
                type: Sequelize.DATE,
                allowNull: false
            },
            helpful_count: {
                type: Sequelize.INTEGER,
                allowNull: false,
                defaultValue: 0
            },
            verified: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                type: Sequelize.DATE
            }
        });

        // Create AdvisoryResponses table
        await queryInterface.createTable('advisory_responses', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            advisory_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Advisories', // from 2025...02 (PascalCase as per file, verify)
                    // 20250926000002 used queryInterface.createTable('Advisories', ...)
                    key: 'id'
                }
            },
            user_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            content: {
                type: Sequelize.TEXT,
                allowNull: false
            },
            attachments: {
                type: Sequelize.ARRAY(Sequelize.STRING),
                defaultValue: []
            },
            is_active: {
                type: Sequelize.BOOLEAN,
                defaultValue: true
            },
            created_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });

        // Create CommissionTransactions table
        await queryInterface.createTable('commission_transactions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                primaryKey: true
            },
            consultation_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'consultations',
                    key: 'id'
                }
            },
            expert_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'experts',
                    key: 'id'
                }
            },
            farmer_id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'Users',
                    key: 'id'
                }
            },
            consultation_type: {
                type: Sequelize.ENUM('virtual', 'on_site', 'emergency'),
                allowNull: false
            },
            expert_fee: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            commission_rate: {
                type: Sequelize.FLOAT,
                allowNull: false
            },
            commission_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            total_amount: {
                type: Sequelize.DECIMAL(10, 2),
                allowNull: false
            },
            payment_status: {
                type: Sequelize.ENUM('pending', 'held_in_escrow', 'released_to_expert', 'refunded'),
                defaultValue: 'pending'
            },
            payment_method: {
                type: Sequelize.STRING,
                allowNull: false
            },
            transaction_id: {
                type: Sequelize.STRING,
                unique: true
            },
            escrow_details: {
                type: Sequelize.JSONB,
                defaultValue: {}
            },
            offline_data: {
                type: Sequelize.JSONB,
                defaultValue: {}
            },
            last_synced_at: {
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            created_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('commission_transactions');
        await queryInterface.dropTable('advisory_responses');
        await queryInterface.dropTable('expert_reviews');
        await queryInterface.dropTable('consultations');
        await queryInterface.dropTable('experts');
    }
};
