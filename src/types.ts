export interface IApplicationOptions {
    serviceDir: string;
    componentDir: string;
    singletons?: any[];
}

export interface ReferredObjectMetadata {
    name: string;
    priority: number;
    type: "service" | "component" | "singleton";
}

export interface ReferredObject extends ReferredObjectMetadata {
    ref: RefBase;
}

export interface RefBase {
    new(): RefBase;
    init?: () => void | Promise<void>;
    shutdown?: () => void | Promise<void>;
}

export interface PendingReference {
    target: Object;
    key: string | symbol;
    typeMeta: any;
}

export enum Keys {
    RefMetaData = "referenced_metadata",
    Refs = "refs"
}
