// utils/generateId.js

export async function generateUserCode(db, level) {
    const counters = db.collection("counters");

    const result = await counters.findOneAndUpdate(
        { _id: level },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
    );

    const seq = result.value.seq.toString().padStart(3, "0");
    return `${level}-${seq}`;
}