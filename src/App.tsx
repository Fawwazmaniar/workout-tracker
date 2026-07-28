import { useEffect, useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { supabase } from './lib/supabaseClient'

function App() {
  useEffect(() => {
    supabase.auth.getSession().then((res) => console.log("session check:", res));
  }, []);

  return (
    <>
      <div>Workout Tracker</div>
    </>
  )
}

export default App
