import React, {useContext, useState} from 'react'
import './App.css'
import {Input, Button} from 'antd'
import {Bar} from 'react-chartjs-2'
import * as moment from 'moment'
const ButtonGroup = Button.Group;

const context = React.createContext()

function App() {
  const [state, setState] = useState({
    searchTerm:'',
    mode:'hourly'
  })
  return <context.Provider value={{
    ...state,
    set: v=> setState({...state, ...v})
  }}>
    <div className="App">
      <Header />
      <Body />
    </div>
  </context.Provider>
}

const modes=['hourly','daily']
function Header(){
  const ctx = useContext(context)
  const {loading, searchTerm, mode} = ctx
  return <header className="App-header">
    <Input 
      value={searchTerm} disabled={loading}
      onChange={e=> ctx.set({searchTerm: e.target.value})}
      style={{height:'3rem',fontSize:'2rem'}} 
      onKeyPress={e=>{
        if(e.key==='Enter' && searchTerm) search(ctx)
      }}
    />
    <Button style={{marginLeft:5,height:'3rem'}}
      onClick={()=> search(ctx)} type="primary"
      disabled={!searchTerm} loading={loading}>
      Search
    </Button>
    <ButtonGroup style={{marginLeft:5,display:'flex'}}>
      {modes.map(m=> <Button style={{height:'3rem'}} 
        type={mode===m?'primary':'default'}
        onClick={()=> ctx.set({mode:m})}>
        {cap(m)}
      </Button>)}
    </ButtonGroup>
  </header>
}

function Body(){
  const ctx = useContext(context)
  const {error, weather, mode} = ctx
  let data
  if(weather){
    console.log(weather)
    data = {
      labels: weather[mode].data.map(d=> {
        let format = 'ddd'
        if(mode==='hourly') format='dd hh:mm'
        return moment(d.time*1000).format(format)
      }),
      datasets: [{
        label:'Temperature',
        data: weather[mode].data.map(d=>{
          if(mode==='hourly') return d.temperature
          else return (d.temperatureHigh+d.temperatureLow)/2
        }),
        backgroundColor: 'rgba(132,99,255,0.2)',
        borderColor: 'rgba(132,99,255,1)',
        hoverBackgroundColor: 'rgba(132,99,255,0.4)',
        hoverBorderColor: 'rgba(132,99,255,1)',
      }]
    }
  }
  console.log(data)
  return <div className="App-body">
    {error && <div className="error">{error}</div>}
    {data && <div>
      <Bar data={data}
        width={800} height={400}
      />
    </div>}
  </div>
}

async function search({searchTerm, set}){
  try {
    const term = searchTerm
    set({error:'', loading:true})

    const osmurl = `https://nominatim.openstreetmap.org/search/${term}?format=json`
    const r = await fetch(osmurl)
    const loc = await r.json()
    if(!loc[0]){
      return set({error:'No city matching that query'})
    }
    const city = loc[0]

    //const url = `/api?lat=${city.lat}&lon=${city.lon}`
    const key = '45236e8510745ee86684a5946eda8cda'
    const url = `https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/${key}/${city.lat},${city.lon}`
    const r2 = await fetch(url)
    const weather = await r2.json()
    set({weather, loading:false, searchTerm:''})
  } catch(e) {
    set({error: e.message})
  }
}

export default App;

function cap(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}