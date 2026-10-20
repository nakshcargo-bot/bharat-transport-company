import { NextResponse } from 'next/server';

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { employeeId, password } = body;

    // Simple check - abhi ke liye koi bhi ID password se login ho jayega
    // Baad me database connect kar dena
    if (employeeId && password) {
      return NextResponse.json(
        { 
          success: true, 
          message: 'Login successful',
          token: 'btc-token-123',
          user: { id: employeeId, name: 'Admin' }
        },
        { 
          status: 200,
          headers: { 'Access-Control-Allow-Origin': '*' }
        }
      );
    }

    return NextResponse.json(
      { success: false, message: 'ID Password dalo' },
      { status: 400, headers: { 'Access-Control-Allow-Origin': '*' } }
    );

  } catch (e) {
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { message: 'Login API working! Use POST method' },
    { headers: { 'Access-Control-Allow-Origin': '*' } }
  );
}
