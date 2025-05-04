"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const axios_1 = __importDefault(require("axios"));
const zod_1 = require("zod");
const TagSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    color: zod_1.z.string(),
    notesCount: zod_1.z.number().optional(),
});
// Create server instance
const server = new mcp_js_1.McpServer({
    name: "knowledge-base",
    version: "1.0.0",
});
server.tool("add_note", "Add a note to the knowledge base", { title: zod_1.z.string(), content: zod_1.z.string(), tags: zod_1.z.array(TagSchema) }, async ({ title, content, tags }) => {
    try {
        const response = await axios_1.default.post("http://localhost:3000/api/notes", {
            title,
            content,
            tags,
        });
        return {
            content: [
                {
                    type: "text",
                    text: `Note created with ID: ${response.data.id}`,
                },
            ],
        };
    }
    catch (e) {
        console.error("Error creating note:", e);
        return {
            content: [
                {
                    type: "text",
                    text: `Error creating note: ${e}`,
                },
            ],
        };
    }
});
server.tool("update_note", "Update an existing note in the knowledge base", {
    id: zod_1.z.string().describe("The ID of the note to update"),
    title: zod_1.z.string().optional().describe("New title for the note"),
    content: zod_1.z.string().optional().describe("New content for the note"),
    tags: zod_1.z.array(TagSchema).optional().describe("New tags for the note"),
}, async ({ id, title, content, tags }) => {
    try {
        // Create update object with only the fields that are provided
        const updateData = {};
        if (title !== undefined)
            updateData.title = title;
        if (content !== undefined)
            updateData.content = content;
        if (tags !== undefined)
            updateData.tags = tags;
        await axios_1.default.put(`http://localhost:3000/api/notes/${id}`, updateData);
        return {
            content: [
                {
                    type: "text",
                    text: `Note with ID: ${id} updated successfully`,
                },
            ],
        };
    }
    catch (e) {
        console.error("Error updating note:", e);
        return {
            content: [
                {
                    type: "text",
                    text: `Error updating note: ${e instanceof Error ? e.message : String(e)}`,
                },
            ],
        };
    }
});
// server.tool(
//   "get_all_notes",
//   "Retrieve all notes from the knowledge base. exposes note ids for further actions",
//   {},
//   async () => {
//     try {
//       const response = await axios.get("http://localhost:3000/api/notes");
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Retrieved ${response.data.length} notes.`,
//           },
//         ],
//       };
//     } catch (e) {
//       console.error("Error retrieving notes:", e);
//       return {
//         content: [
//           {
//             type: "text",
//             text: `Error retrieving notes: ${
//               e instanceof Error ? e.message : String(e)
//             }`,
//           },
//         ],
//       };
//     }
//   }
// );
server.tool("find_note_id_by_keyword", "Find the ID of a note whose title or content matches the given keyword", {
    keyword: zod_1.z
        .string()
        .describe("A keyword to search for in note titles or content"),
}, async ({ keyword }) => {
    try {
        const response = await axios_1.default.get("http://localhost:3000/api/notes");
        const notes = response.data;
        // Find the first note that includes the keyword in the title or content
        const matchingNote = notes.find((note) => note.title?.toLowerCase().includes(keyword.toLowerCase()) ||
            note.content?.toLowerCase().includes(keyword.toLowerCase()));
        console.log("Matching note:", matchingNote, keyword.toLowerCase());
        if (!matchingNote) {
            return {
                content: [
                    {
                        type: "text",
                        text: `No note found containing the keyword: "${keyword}"`,
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: "text",
                    text: `Found note with ID: ${matchingNote.id}`,
                },
            ],
        };
    }
    catch (e) {
        console.error("Error searching notes:", e);
        return {
            content: [
                {
                    type: "text",
                    text: `Error searching notes: ${e instanceof Error ? e.message : String(e)}`,
                },
            ],
        };
    }
});
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Knowldge base MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
