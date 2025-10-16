import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authManager } from '@/lib/browserAuth';
import { browserStorage } from '@/lib/browserStorage';

export function DebugAuth() {
  const [email, setEmail] = useState('admin@demo.com');
  const [password, setPassword] = useState('demo123');
  const [result, setResult] = useState<string>('');
  const [allUsers, setAllUsers] = useState<any[]>([]);

  const testLogin = async () => {
    try {
      setResult('Testing login...');
      console.log('🧪 Debug: Testing login with:', { email, password });
      
      const user = await authManager.login(email, password);
      setResult(`✅ Login successful! User: ${user.fullName} (${user.email})`);
    } catch (error) {
      setResult(`❌ Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const listAllUsers = async () => {
    try {
      setResult('Fetching all users...');
      const users = await browserStorage.getAllUsers();
      setAllUsers(users);
      setResult(`Found ${users.length} users in database`);
    } catch (error) {
      setResult(`❌ Failed to fetch users: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const clearDatabase = async () => {
    try {
      setResult('Clearing database...');
      await browserStorage.clearDatabase();
      setResult('✅ Database cleared');
    } catch (error) {
      setResult(`❌ Failed to clear database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const seedDatabase = async () => {
    try {
      setResult('Seeding database...');
      await browserStorage.seedDatabase();
      setResult('✅ Database seeded');
    } catch (error) {
      setResult(`❌ Failed to seed database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Authentication Debug Tool</CardTitle>
          <CardDescription>
            Use this tool to debug login issues. Check the browser console for detailed logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@demo.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="demo123"
              />
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testLogin}>Test Login</Button>
            <Button onClick={listAllUsers} variant="outline">List All Users</Button>
            <Button onClick={clearDatabase} variant="destructive">Clear DB</Button>
            <Button onClick={seedDatabase} variant="secondary">Seed DB</Button>
          </div>
          
          {result && (
            <div className="p-3 bg-muted rounded-md">
              <pre className="text-sm">{result}</pre>
            </div>
          )}
          
          {allUsers.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">All Users in Database:</h4>
              <div className="space-y-1">
                {allUsers.map((user, index) => (
                  <div key={index} className="p-2 bg-muted rounded text-sm">
                    <strong>{user.fullName}</strong> ({user.email}) - {user.role}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
