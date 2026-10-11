import React from "react";
import { Composition, Folder } from "remotion";
import { BAR } from "./theme";
import { Fold, SCENES, TOTAL_FRAMES } from "./Fold";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="FoldDemo" component={Fold} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    <Folder name="Scenes">
      {SCENES.map((s) => (
        <Composition key={s.name} id={s.name.replace(/[^A-Za-z]/g, "")} component={s.C} durationInFrames={s.bars * BAR} fps={30} width={1920} height={1080} />
      ))}
    </Folder>
  </>
);
