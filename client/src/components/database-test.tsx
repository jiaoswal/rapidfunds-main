import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { db, browserStorage } from '@/lib/browserStorage';
import { authManager } from '@/lib/browserAuth';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  details?: any;
}

export default function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'pending', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDatabaseConnection = async () => {
    addResult('Database Connection', 'pending', 'Testing database connection...');
    
    try {
      await db.open();
      const userCount = await db.users.count();
      const orgCount = await db.organizations.count();
      const memberCount = await db.orgMembers.count();
      
      addResult('Database Connection', 'success', 
        `Database connected successfully! Users: ${userCount}, Organizations: ${orgCount}, Org Members: ${memberCount}`);
    } catch (error: any) {
      addResult('Database Connection', 'error', 
        `Database connection failed: ${error.message}`, error);
    }
  };

  const testMigration = async () => {
    addResult('Migration Test', 'pending', 'Testing database migration...');
    
    try {
      // Try to access the new org-scoped tables
      const members = await db.orgMembers.toArray();
      const requests = await db.orgRequests.toArray();
      const charts = await db.orgCharts.toArray();
      const audits = await db.orgAuditLogs.toArray();
      
      addResult('Migration Test', 'success', 
        `Migration successful! Org Members: ${members.length}, Org Requests: ${requests.length}, Org Charts: ${charts.length}, Audit Logs: ${audits.length}`);
    } catch (error: any) {
      addResult('Migration Test', 'error', 
        `Migration failed: ${error.message}`, error);
    }
  };

  const testOrgMembers = async () => {
    addResult('Org Members Test', 'pending', 'Testing org members functionality...');
    
    try {
      // Get all organizations first
      const orgs = await db.organizations.toArray();
      if (orgs.length === 0) {
        addResult('Org Members Test', 'success', 'No organizations found - this is expected for a fresh install');
        return;
      }

      const testOrgId = orgs[0].orgId;
      const members = await browserStorage.getOrgMembers(testOrgId);
      
      addResult('Org Members Test', 'success', 
        `Org members functionality working! Retrieved ${members.length} members for org: ${orgs[0].name}`);
    } catch (error: any) {
      addResult('Org Members Test', 'error', 
        `Org members test failed: ${error.message}`, error);
    }
  };

  const testAuth = async () => {
    addResult('Authentication Test', 'pending', 'Testing authentication system...');
    
    try {
      const currentUser = authManager.getCurrentUser();
      const isAuthenticated = authManager.isAuthenticated();
      
      addResult('Authentication Test', 'success', 
        `Authentication system working! Current user: ${currentUser ? currentUser.fullName : 'None'}, Authenticated: ${isAuthenticated}`);
    } catch (error: any) {
      addResult('Authentication Test', 'error', 
        `Authentication test failed: ${error.message}`, error);
    }
  };

  const resetDatabase = async () => {
    addResult('Database Reset', 'pending', 'Resetting database...');
    
    try {
      await db.close();
      await db.delete();
      addResult('Database Reset', 'success', 
        'Database reset successful! Please refresh the page to continue.');
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      addResult('Database Reset', 'error', 
        `Database reset failed: ${error.message}`, error);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    clearResults();
    
    await testDatabaseConnection();
    await testMigration();
    await testOrgMembers();
    await testAuth();
    
    setIsRunning(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 border-green-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 Database Migration Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This component tests the database migration and error handling for the RapidFunds app.
          </p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Button 
              onClick={runAllTests} 
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
            <Button onClick={testDatabaseConnection} variant="outline">
              Test Database Connection
            </Button>
            <Button onClick={testMigration} variant="outline">
              Test Migration
            </Button>
            <Button onClick={testOrgMembers} variant="outline">
              Test Org Members
            </Button>
            <Button onClick={testAuth} variant="outline">
              Test Authentication
            </Button>
            <Button onClick={resetDatabase} variant="destructive">
              Reset Database
            </Button>
            <Button onClick={clearResults} variant="ghost">
              Clear Results
            </Button>
          </div>

          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Test Results</h3>
              {results.map((result, index) => (
                <div key={index} className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{result.test}</div>
                    <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <div className="mt-2 text-sm">{result.message}</div>
                  {result.details && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs text-gray-600">Show Details</summary>
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
