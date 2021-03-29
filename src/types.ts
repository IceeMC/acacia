export interface IApplicationOptions {
    serviceDir: string;
    componentDir: string;
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
    typeMeta: any;
    key: string | symbol;
    targetMeta: ReferredObjectMetadata;
}

export enum Keys {
    RefMetaData = "referenced_metadata"
}
