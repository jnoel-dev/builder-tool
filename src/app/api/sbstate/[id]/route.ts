import { NextResponse } from "next/server";
export const runtime = "nodejs";
import { firestoreAdmin } from "../firebase-admin";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!/^[A-Za-z0-9]{20}$/.test(id)) {
    return NextResponse.json({ error: "bad_id" }, { status: 400 });
  }

  try {
    const snap = await firestoreAdmin.collection("sbStates").doc(id).get();
    const stateJson = snap.exists ? (snap.data()?.stateJson ?? "") : "";
    return NextResponse.json({ stateJson }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 500 });
  }
}
