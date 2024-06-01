type Role = "system" | "user" | "assistant";

interface AIMessage {
    role: Role;
    content: string;
    name?: string;
}

export type { AIMessage, Role };
