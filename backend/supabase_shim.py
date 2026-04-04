"""
Lightweight Supabase Client Wrapper
Uses httpx directly to avoid Rust compilation issues on deployment platforms
"""
import os
import httpx
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = "".join(char for char in os.getenv("SUPABASE_URL", "") if char.isprintable()).strip()
SUPABASE_KEY = "".join(char for char in os.getenv("SUPABASE_KEY", "") if char.isprintable()).strip()


class SupabaseTable:
    """Wrapper for Supabase table operations using REST API"""
    
    def __init__(self, client: 'Client', table_name: str):
        self.client = client
        self.table_name = table_name
        self._filters: List[str] = []
        self._select_columns = "*"
        self._order_by: Optional[str] = None
        self._limit_val: Optional[int] = None
        self._single = False
        self._method = "GET"
        self._data = None
        self._headers = {}
    
    def select(self, columns: str = "*") -> 'SupabaseTable':
        self._select_columns = columns
        self._method = "GET"
        return self
    
    def eq(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=eq.{value}")
        return self
    
    def neq(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=neq.{value}")
        return self
    
    def gt(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=gt.{value}")
        return self
    
    def gte(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=gte.{value}")
        return self
    
    def lt(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=lt.{value}")
        return self
    
    def lte(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=lte.{value}")
        return self
    
    def like(self, column: str, pattern: str) -> 'SupabaseTable':
        self._filters.append(f"{column}=like.{pattern}")
        return self
    
    def ilike(self, column: str, pattern: str) -> 'SupabaseTable':
        self._filters.append(f"{column}=ilike.{pattern}")
        return self
    
    def is_(self, column: str, value: Any) -> 'SupabaseTable':
        self._filters.append(f"{column}=is.{value}")
        return self
    
    def in_(self, column: str, values: List[Any]) -> 'SupabaseTable':
        vals = ",".join(str(v) for v in values)
        self._filters.append(f"{column}=in.({vals})")
        return self
    
    def order(self, column: str, desc: bool = False) -> 'SupabaseTable':
        direction = "desc" if desc else "asc"
        self._order_by = f"{column}.{direction}"
        return self
    
    def limit(self, count: int) -> 'SupabaseTable':
        self._limit_val = count
        return self
    
    def single(self) -> 'SupabaseTable':
        self._single = True
        self._limit_val = 1
        return self
    
    def _build_url(self) -> str:
        url = f"{self.client.url}/rest/v1/{self.table_name}"
        query_params = []
        if self._method == "GET":
            query_params.append(f"select={self._select_columns}")
        
        query_params.extend(self._filters)
        
        if self._order_by:
            query_params.append(f"order={self._order_by}")
        if self._limit_val:
            query_params.append(f"limit={self._limit_val}")
            
        if query_params:
            return url + "?" + "&".join(query_params)
        return url
    
    def execute(self) -> 'SupabaseResponse':
        url = self._build_url()
        headers = {**self.client.headers, **self._headers}
        
        try:
            if self._method == "GET":
                response = httpx.get(url, headers=headers, timeout=30.0)
            elif self._method == "POST":
                response = httpx.post(url, json=self._data, headers=headers, timeout=30.0)
            elif self._method == "PATCH":
                response = httpx.patch(url, json=self._data, headers=headers, timeout=30.0)
            elif self._method == "DELETE":
                response = httpx.delete(url, headers=headers, timeout=30.0)
            else:
                raise ValueError(f"Unsupported method: {self._method}")
            
            # Handle empty response or errors
            if response.status_code in [200, 201]:
                try:
                    data = response.json()
                except:
                    data = []
            else:
                return SupabaseResponse(data=[], error=response.text)

            if self._single and isinstance(data, list) and len(data) > 0:
                data = data[0]
            elif self._single and isinstance(data, list) and len(data) == 0:
                data = None
                
            return SupabaseResponse(data=data, error=None)
        except Exception as e:
            return SupabaseResponse(data=[], error=str(e))
    
    def insert(self, data: Dict[str, Any]) -> 'SupabaseTable':
        self._method = "POST"
        self._data = data
        self._headers = {"Prefer": "return=representation"}
        return self
    
    def update(self, data: Dict[str, Any]) -> 'SupabaseTable':
        self._method = "PATCH"
        self._data = data
        self._headers = {"Prefer": "return=representation"}
        return self
    
    def delete(self) -> 'SupabaseTable':
        self._method = "DELETE"
        self._headers = {"Prefer": "return=representation"}
        return self
    
    def upsert(self, data: Dict[str, Any], on_conflict: Optional[str] = None) -> 'SupabaseTable':
        self._method = "POST"
        self._data = data
        self._headers = {"Prefer": "return=representation,resolution=merge-duplicates"}
        if on_conflict:
            # Note: in REST API, on_conflict is usually a query parameter
            self._filters.append(f"on_conflict={on_conflict}")
        return self


class SupabaseResponse:
    """Response wrapper to match supabase-py interface"""
    def __init__(self, data: Any, error: Optional[str] = None):
        self.data = data
        self.error = error
    
    def execute(self):
        """Safety fallback if .execute() is called twice or on a response"""
        return self


class Client:
    """Lightweight Supabase Client that mimics supabase-py interface"""
    
    def __init__(self, url: str, key: str):
        # Bulletproof cleaning of URL and Key
        self.url = "".join(char for char in str(url) if char.isprintable()).strip().rstrip("/")
        self.key = "".join(char for char in str(key) if char.isprintable()).strip()
        self.headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
    
    def table(self, table_name: str) -> SupabaseTable:
        return SupabaseTable(self, table_name)
    
    def from_(self, table_name: str) -> SupabaseTable:
        """Alias for table() to match supabase-py interface"""
        return self.table(table_name)
    
    def rpc(self, function_name: str, params: Dict[str, Any] = None) -> SupabaseResponse:
        """Call a Supabase RPC function"""
        url = f"{self.url}/rest/v1/rpc/{function_name}"
        response = httpx.post(url, json=params or {}, headers=self.headers, timeout=30.0)
        data = response.json() if response.status_code == 200 else None
        return SupabaseResponse(data=data, error=None if response.status_code == 200 else response.text)


def create_client(url: str, key: str) -> Client:
    """Create a Supabase client - matches supabase-py interface"""
    return Client(url, key)


# Default client instance
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
