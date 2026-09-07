import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || (!process.env.SUPABASE_SECRET_KEY && !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY in .env.local",
                },
                { status: 500 }
            );
        }

        const { data, error } = await supabase
            .from("users")
            .select("*")
            .limit(5);

        if (error) {
            throw error;
        }

        return NextResponse.json({
            success: true,
            data,
        });
    } catch (error) {
        console.error("Supabase error:", error);

        return NextResponse.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
}