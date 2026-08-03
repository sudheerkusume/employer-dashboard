import clientPromise from "@/app/components/lib/db";

export async function GET(req) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);
        
        // Find the global settings document, or return default values
        let settings = await db.collection("settings").findOne({ identifier: "global" });
        if (!settings) {
            settings = {
                organizationName: "Realbeez",
                organizationEmail: "admin@realbeez.com",
                organizationPhone: "+91 9999999999",
                taxId: "",
                address: "",
                defaultWorkHoursStart: "09:30",
                defaultWorkHoursEnd: "18:30",
                timezone: "Asia/Kolkata",
                currency: "INR",
                passwordPolicyLength: "8",
                passwordPolicyExpiry: "90",
                eodEnabled: true
            };
        }

        return Response.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DBNAME);

        const updateData = { ...body };
        delete updateData._id; // Prevent MongoDB error when updating
        
        await db.collection("settings").updateOne(
            { identifier: "global" },
            { $set: updateData },
            { upsert: true }
        );

        return Response.json({ success: true, message: "Settings updated successfully" });
    } catch (error) {
        console.error("Error updating settings:", error);
        return Response.json({ error: error.message }, { status: 500 });
    }
}
