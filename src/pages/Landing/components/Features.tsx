import type {FeaturesData} from '../../../services/types';
import { FeaturesJsonData } from '@/data/FeaturesData';
import {FeaturesCard} from '@/components/ui/FeaturesCard'

export const Features:React.FC=()=>{
    const featuesdata:FeaturesData[]=FeaturesJsonData;
    return (
      <section className='mt-2'>
         <div className='block'>
          <span>A Complete AI Workspace</span>
         </div>
         <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-2 px-16 item-stretch'>
           {featuesdata.map((data)=>(
             <FeaturesCard cards={data}/>
           ))}
         </div>
      </section>
    )
}