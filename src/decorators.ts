import {Keys, ReferredObjectMetadata} from "./types";
import {Application} from "./Application";

export const App: PropertyDecorator = (target: Object, key: string) => {
    Object.defineProperty(target, key, {
        get() {
            return Application.instance;
        },
        set() {
            throw new SyntaxError("References cannot mutate state");
        }
    })
}

export const Component = (name: string, priority: number = -1): ClassDecorator => {
    return target => {
        Reflect.defineMetadata(Keys.RefMetaData, <ReferredObjectMetadata>{
            name,
            priority,
            type: "component"
        }, target);
    };
}

export const Service = (name: string, priority: number = -1): ClassDecorator => {
    return target => {
        Reflect.defineMetadata(Keys.RefMetaData, <ReferredObjectMetadata>{
            name,
            priority,
            type: "service"
        }, target);
    };
}

export const Ref: PropertyDecorator = (target, key) => {
    const typeMeta = Reflect.getMetadata("design:type", target, key);
    if (!typeMeta) throw new ReferenceError(`Reference to ${key.toString()} does not have a corresponding type, or is a circular dependency!`);
    const targetMeta = Reflect.getMetadata(Keys.RefMetaData, typeMeta);
    if (!targetMeta) throw new ReferenceError(`Reference to ${key.toString()} is not one of Service, Component, Singleton`);
    Application.instance.refs.push({target, typeMeta, key, targetMeta});
};
