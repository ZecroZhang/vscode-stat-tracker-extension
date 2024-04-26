// Some general helper structs

/**
 * `Partial` utility type but instead of affecting only the object properties, it affects all sub-properties of the object. 
 */
export type DeepPartial<Type> = {
  [ Property in keyof Type ]?: Type[Property] extends object ? ( Type[Property] extends any[] ? Type[Property] : DeepPartial<Type[Property]> ) : Type[Property]
}

export type TimeRangeNames = "allTime" | "weeklyTime" | "todayTime"
