const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'services', 'api.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Add membership endpoints to the forums object
const membershipEndpoints = `,
        // Membership endpoints
        joinForum: (forumId: string) => request<{ success: boolean; data: any; message: string }>(\`/forums/topics/\${forumId}/join\`, { method: 'POST' }),
        leaveForum: (forumId: string) => request<{ success: boolean; message: string }>(\`/forums/topics/\${forumId}/leave\`, { method: 'POST' }),
        getMembers: (forumId: string) => request<{ success: boolean; data: any[] }>(\`/forums/topics/\${forumId}/members\`)`;

// Insert before the closing of forums object (before the closing brace and comma)
content = content.replace(
    /(\n        }\n    },\n    products: {)/,
    membershipEndpoints + '$1'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated api.ts');
