import React, {useState} from 'react';
import {Shield, SquareTerminal, Activity, Cpu, GitCompare, BarChart3, History} from 'lucide-react';
import {WorkspacePage} from '@/pages/WorkspacePage';
import {CloudPage} from '@/pages/CloudPage';
import {ModelsPage} from '@/pages/ModelsPage';
import {HomePage} from '@/pages/HomePage';
import {useHealth} from '@/hooks/useHealth';
import {useOllamaStatus} from '@/hooks/useOllamaStatus';
type Tab='cloud'|'workspace'|'benchmark'|'analytics'|'history'|'models'|'system';
const nav=[{id:'cloud',label:'Optimize',Icon:Cpu},{id:'workspace',label:'Local tools',Icon:SquareTerminal},{id:'benchmark',label:'Benchmark',Icon:GitCompare},{id:'analytics',label:'Analytics',Icon:BarChart3},{id:'history',label:'History',Icon:History},{id:'models',label:'Model Gateway',Icon:Cpu},{id:'system',label:'System Status',Icon:Activity}] as const;
export const App:React.FC=()=>{
 const [tab,setTab]=useState<Tab>('cloud');
 const {health,error,refetch}=useHealth(true);
 const {status,checkStatus}=useOllamaStatus(true);
 const online=!error&&health?.status==='ok';
 const ready=Boolean(status?.connected&&status?.model_installed);
 const navigate=(t:Tab)=>{setTab(t);if(t==='models'||t==='system'){void refetch();void checkStatus();}};
 return <div className="studio-shell"><aside className="studio-sidebar">
 <div className="studio-brand"><div className="studio-mark"><Shield size={23}/></div><div><strong>Argus</strong><small>STUDIO 2.0</small></div></div>
 <p className="studio-nav-label">WORKSPACE</p><nav aria-label="Main navigation" className="studio-nav">{nav.map(({id,label,Icon})=><button key={id} aria-current={tab===id?'page':undefined} onClick={()=>navigate(id)}><Icon size={18}/>{label}</button>)}</nav>
 <div className="studio-sidebar-bottom"><Cpu size={16}/><div><strong>Local runtime: {ready?'Ready':status?'Offline':'Checking'}</strong><small>{ready?status?.model:'Ollama runtime'}</small></div></div><p className="studio-tagline">Understand. Optimize. Execute.</p></aside>
 <div className="studio-main"><header className="studio-topbar"><span>Argus / {nav.find(n=>n.id===tab)?.label}</span><span className="studio-health" role="status"><i data-online={online}/>API {online?'Online':error?'Offline':'Checking'}</span></header>
 <main id="main-content"><div hidden={tab==='cloud'||tab==='models'||tab==='system'}><WorkspacePage ollamaStatus={status} view={tab==='cloud'||tab==='models'||tab==='system'?'workspace':tab} onOpenOptimizer={()=>navigate('workspace')}/></div>{tab==='cloud'&&<CloudPage/>}{tab==='models'&&<ModelsPage/>}{tab==='system'&&<HomePage onRefreshStatus={()=>{void refetch();void checkStatus();}}/>}</main></div></div>;
};
export default App;
