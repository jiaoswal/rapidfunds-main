// orgChartDB.ts - IndexedDB helper for org chart members
export interface OrgChartMember {
  id: string;
  name: string;
  role: string;
  department?: string;
  email?: string;
  parentId?: string | null;
  level: number;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DB_NAME = "RapidFundsOrgChartDB";
const DB_VERSION = 1;
const STORE_NAME = "members";

export const openOrgChartDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create members object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        
        // Create indexes for efficient queries
        store.createIndex("parentId", "parentId", { unique: false });
        store.createIndex("level", "level", { unique: false });
        store.createIndex("department", "department", { unique: false });
        store.createIndex("isActive", "isActive", { unique: false });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const addOrgChartMember = async (member: Omit<OrgChartMember, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  const newMember: OrgChartMember = {
    ...member,
    id: crypto.randomUUID(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(newMember);
    request.onsuccess = () => resolve(newMember.id);
    request.onerror = () => reject(request.error);
  });
};

export const updateOrgChartMember = async (id: string, updates: Partial<OrgChartMember>): Promise<void> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const getRequest = store.get(id);
    getRequest.onsuccess = () => {
      const member = getRequest.result;
      if (member) {
        const updatedMember = {
          ...member,
          ...updates,
          updatedAt: new Date(),
        };
        
        const putRequest = store.put(updatedMember);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        reject(new Error(`Member with id ${id} not found`));
      }
    };
    getRequest.onerror = () => reject(getRequest.error);
  });
};

export const deleteOrgChartMember = async (id: string): Promise<void> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getOrgChartMembers = async (): Promise<OrgChartMember[]> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readonly");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getOrgChartMember = async (id: string): Promise<OrgChartMember | null> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readonly");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getMembersByParent = async (parentId: string | null): Promise<OrgChartMember[]> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("parentId");
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(parentId);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getMembersByLevel = async (level: number): Promise<OrgChartMember[]> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readonly");
  const store = tx.objectStore(STORE_NAME);
  const index = store.index("level");
  
  return new Promise((resolve, reject) => {
    const request = index.getAll(level);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const searchOrgChartMembers = async (query: string): Promise<OrgChartMember[]> => {
  const allMembers = await getOrgChartMembers();
  const lowercaseQuery = query.toLowerCase();
  
  return allMembers.filter(member => 
    member.name.toLowerCase().includes(lowercaseQuery) ||
    member.role.toLowerCase().includes(lowercaseQuery) ||
    (member.department && member.department.toLowerCase().includes(lowercaseQuery)) ||
    (member.email && member.email.toLowerCase().includes(lowercaseQuery))
  );
};

export const buildOrgChartTree = async (): Promise<OrgChartMember[]> => {
  const allMembers = await getOrgChartMembers();
  const memberMap = new Map<string, OrgChartMember & { children: OrgChartMember[] }>();
  const roots: (OrgChartMember & { children: OrgChartMember[] })[] = [];
  
  // Create map with children array
  allMembers.forEach(member => {
    memberMap.set(member.id, { ...member, children: [] });
  });
  
  // Build tree structure
  allMembers.forEach(member => {
    const memberWithChildren = memberMap.get(member.id)!;
    
    if (member.parentId && memberMap.has(member.parentId)) {
      const parent = memberMap.get(member.parentId)!;
      parent.children.push(memberWithChildren);
    } else {
      roots.push(memberWithChildren);
    }
  });
  
  return roots;
};

export const clearOrgChartData = async (): Promise<void> => {
  const db = await openOrgChartDB();
  const tx = db.transaction([STORE_NAME], "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Seed data for initial setup
export const seedOrgChartData = async (): Promise<void> => {
  const existingMembers = await getOrgChartMembers();
  if (existingMembers.length > 0) {
    console.log('Org chart data already exists, skipping seed');
    return;
  }

  const seedMembers: Omit<OrgChartMember, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: "John Smith",
      role: "CEO",
      department: "Executive",
      email: "john.smith@company.com",
      parentId: null,
      level: 0,
      isActive: true,
    },
    {
      name: "Sarah Johnson",
      role: "CTO",
      department: "Technology",
      email: "sarah.johnson@company.com",
      parentId: null,
      level: 1,
      isActive: true,
    },
    {
      name: "Mike Davis",
      role: "CFO",
      department: "Finance",
      email: "mike.davis@company.com",
      parentId: null,
      level: 1,
      isActive: true,
    },
    {
      name: "Emily Chen",
      role: "VP Engineering",
      department: "Technology",
      email: "emily.chen@company.com",
      parentId: null,
      level: 2,
      isActive: true,
    },
    {
      name: "David Wilson",
      role: "Senior Developer",
      department: "Technology",
      email: "david.wilson@company.com",
      parentId: null,
      level: 3,
      isActive: true,
    },
  ];

  // Add seed members
  for (const member of seedMembers) {
    await addOrgChartMember(member);
  }

  console.log('Org chart seed data created successfully');
};

