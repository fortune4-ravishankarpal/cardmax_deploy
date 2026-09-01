/* 
import { payloadKanbanBoard } from 'payload-kanban-board';

export const KanbanBoardConfig = payloadKanbanBoard({
    collections: {
        CreditCard: {
            enabled: true,
            config: {
                statuses: [
                    {
                        value: 'draft',
                        label: 'Draft',
                    },
                    {
                        value: 'ready-for-review',
                        label: 'Ready for review',
                        dropValidation: ({ user, data }) => {
                            return { dropAble: false }
                        },
                    },
                    { value: 'published', label: 'Published' },
                ],
                defaultStatus: 'draft',
                hideNoStatusColumn: true,
            },
        },
    },
})
*/