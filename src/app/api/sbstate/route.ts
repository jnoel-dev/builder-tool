import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { firestoreAdmin } from "./firebase-admin";

export async function POST() {
  try {
    const createdRef = await firestoreAdmin
      .collection("sbStates")
      .add({ stateJson: "" });
    return NextResponse.json({ id: createdRef.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
