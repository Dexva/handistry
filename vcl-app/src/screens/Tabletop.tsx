/*------------
   IMPORTS
------------*/
import React, { useState } from 'react';
import Glassware from '../components/Glassware';
import Entity from '../components/Entity';
import { Entity as EntityModel } from "../vcl-model/Entity";
import { Glassware as GlasswareModel } from "../vcl-model/Glassware";
import EntityContainer from '../components/EntityContainer';
import Cursor from '../vcl-model/Cursor';
import {cursorX, cursorY} from '../vcl-model/Engine';
import GraduatedSideview from '../components/GraduatedSideview';
import { socket } from '../socket.js';
import { EngineTimestep } from '../vcl-model/Engine';
import Tooltip from '../components/Tooltip';
import { tooltipEntity } from '../vcl-model/Engine';
import { graduatedDisplayEntity } from '../vcl-model/Engine';
import { setToScreen } from '../App';
import DebugDot from '../components/DebugDot';
import { debugDotDatas } from '../components/DebugDot';

import '../styles/style.css';

/* Given 2 rectangular hitboxes, check if the 2 overlaps */
function checkIntersection(rect1 : any, rect2 : any) {
    //https://stackoverflow.com/questions/12066870/how-to-check-if-an-element-is-overlapping-other-elements
    // return !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);
    const midpoint1 = {
        x:(rect1.left + rect1.right) / 2,
        y:(rect1.top + rect1.bottom) / 2
    }
    const midpoint2 = {
        x:(rect2.left + rect2.right) / 2,
        y:(rect2.top + rect2.bottom) / 2
    }
    // distance of rects in pixels
    const dist = Math.sqrt(Math.pow(midpoint2.x - midpoint1.x, 2) + Math.pow(midpoint2.y - midpoint1.y,2));
    return dist < 100;
}

/*
TL;DR: The main working area.
The Tabletop screen is where the user can perform the experiment.
Here, the user may drag-and-drop glassware and make them interact with one another.

To-do: Integrate virtual cursor and NUI.
*/

let x = 0;

function Tabletop() {

    const [update, setUpdate] = useState(x);

    let newMessage: any = false;
    //---- SOCKET.IO ----//
    socket.on('message', (msg) => {
        newMessage = msg;
    }); 

    // setInterval(()=>{
    
    function run() {
        if (newMessage) {
            EngineTimestep(newMessage.gesture, newMessage.landmarks, newMessage.handedness.at(0).displayName);
            // console.log(newMessage.handedness);
            if (x<10000) x += 1;
            else x = 0;
            setUpdate(x);
        }
        window.requestAnimationFrame(run);
    }
    window.requestAnimationFrame(run);
    // },30);

    //----- VARIABLES & STATES -----//

    //----- FUNCTIONS -----//
    
    //----- ELEMENTS UNDER COMPONENT -----//
    var entityElements : any[] = Array.from(EntityModel.allInstances(), (entityData, index) => { //not the cause of problem
        var equipment : any = entityData.getData();
        return <Entity entityIndex={index}>
            <Glassware data={equipment}/>
        </Entity>
    });

    let displayGraduations = false;
    let graduations: number[] = new Array(4);
    let fill: number = 0;
    let max: number = 0;
    if (graduatedDisplayEntity) {
        let glasswareModel = (graduatedDisplayEntity.getData() as GlasswareModel);
        max = glasswareModel.getMaxCap();
        graduations[0] = max;
        graduations[1] = max / 4 * 3;
        graduations[2] = max / 4 * 2;
        graduations[3] = max / 4;

        fill = glasswareModel.getMixture().getVolume();

        displayGraduations = true;
    }

    //----- ELEMENTS UNDER COMPONENT -----//
    var debugDotElements : any[] = Array.from(debugDotDatas,(dotData,index)=>{
        return <DebugDot
            x={dotData.x}
            y={dotData.y}
            color={dotData.color}
        ></DebugDot>
    });

    //----- RETURN -----//
    return (
        <div className="Tabletop">
            <div onClick={(e) => {setToScreen(2)}} className="tabletopToStockroom screenChangeButton"></div>
            <div onClick={(e) => {EntityModel.clearInstances()}} className="clearTabletop screenChangeButton"></div>
            <EntityContainer> 
                {entityElements}
            </EntityContainer>
            <div className="debugDotParent">
                {debugDotElements}
            </div>
            <Cursor></Cursor>
            <Tooltip entity={tooltipEntity}/>
            <GraduatedSideview 
                displayState={displayGraduations}
                graduations={graduations}
                fill={fill}
                max={max}
            />
        </div>
    );
}

export default Tabletop;