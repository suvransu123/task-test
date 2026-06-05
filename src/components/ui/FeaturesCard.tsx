import type { FeaturesData } from "../../services/types";
interface FeatureDataProps{
    cards:FeaturesData
}

export const FeaturesCard:React.FC<FeatureDataProps> = ({cards})=>{
    return (
        <div className="group flex flex-col gap-4 h-[400px] border border-gray-600 p-4 rounded-xl overflow-hidden">
            <div>
                <p className={`${cards.badge}`}>{cards.badge}</p>
                 <h2 className="">{cards.title}</h2>
                 <span>
                    {cards.description}
                 </span>
            </div>
        </div>
    )
}