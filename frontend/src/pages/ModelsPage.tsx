import React,{useEffect,useState} from 'react';
import {apiService} from '@/services/api';
import {Card} from '@/components/Card';
import {Button} from '@/components/Button';
import type {ModelCatalogResponse} from '@/types';
export const ModelsPage:React.FC=()=>{
 const [catalog,setCatalog]=useState<ModelCatalogResponse|null>(null);
 const [error,setError]=useState('');const [loading,setLoading]=useState(false);
 const load=async()=>{setLoading(true);setError('');try{setCatalog(await apiService.getModels());}catch(e){setCatalog(null);setError(e instanceof Error?e.message:'Discovery failed');}finally{setLoading(false);}};
 useEffect(()=>{void load();},[]);
 return <div className="studio-workspace max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6"><header className="flex flex-wrap justify-between gap-3"><div><p className="studio-eyebrow">INFRASTRUCTURE</p><h1 className="text-3xl font-bold mt-2">Model gateway</h1><p className="text-sm text-slate-400 mt-2">Models discovered from the configured Ollama server.</p></div><Button variant="outline" onClick={()=>void load()} isLoading={loading}>Refresh models</Button></header>
 {error&&<p role="alert" className="text-red-300">{error}</p>}<Card title="Installed models">{loading?<p role="status">Discovering models…</p>:!catalog?.models.length?<p className="text-slate-400">No models discovered. Verify Ollama connectivity.</p>:<div className="grid sm:grid-cols-2 gap-3">{catalog.models.map(m=><div key={m.name} className="border border-white/10 rounded-lg p-4"><strong className="break-all">{m.name}</strong><p className="text-xs text-slate-400 mt-2">{m.parameter_size||m.tier} · {m.is_loaded?'Loaded':'Available'}</p></div>)}</div>}</Card></div>;
};