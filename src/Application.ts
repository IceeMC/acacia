import "reflect-metadata";
import {IApplicationOptions, Keys, PendingReference, ReferredObject, ReferredObjectMetadata} from "./types";
import {Util} from "./Util";
import {randomBytes} from "crypto";
import {EventEmitter} from "events";

const isClass = (t: any): boolean => t.constructor?.toString().substring(0, 5) === "class";

export class Application extends EventEmitter {

    singletons: ReferredObject[] = [];
    services: ReferredObject[] = [];
    components: ReferredObject[] = [];
    refs: PendingReference[] = [];

    constructor(private options: IApplicationOptions) {
        super();
        if (Application._instance)
            throw new SyntaxError("An application is already registered!");
        Application._instance = this;
    }

    private static _instance: Application;

    static get instance(): Application {
        return Application._instance;
    }

    on(event: "beforeInit", listener: (ref: ReferredObject) => void): this;
    on(event: "afterInit", listener: (ref: ReferredObject) => void): this;
    on(event: "initError", listener: (ref: ReferredObject, err: Error) => void): this;
    on(event: string, listener: (...args: any[]) => void): this {
        return super.on(event, listener);
    }

    /*
     * Loads all components/services, then injects any pending references.
     */
    public async load(): Promise<void> {
        this.initialiseDirectory(this.options.componentDir);
        this.initialiseDirectory(this.options.serviceDir);
        await this.injectRefs();
    }

    /**
     * Registers a singleton.
     * @param s The singleton to register
     */
    public registerSingleton(s: any): void {
        if (this.singletons.includes(s))
            throw new Error(`Attempt to register duplicate singleton ${s}`);
        const data: ReferredObject = {
            name: randomBytes(2).toString("hex"),
            priority: -1,
            type: "singleton",
            ref: s
        };
        Reflect.defineMetadata(Keys.RefMetaData, data, isClass(s) ? s.constructor : s);
        this.singletons.push(data);
    }

    /**
     * Returns an array of all singletons, components, services.
     */
    public getAllReferredObjects(): ReferredObject[] {
        return [...this.singletons, ...this.components, ...this.services];
    }

    /**
     * Finds a reference for `cls` in singletons, services, and components.
     * Services can rely on components, and components can rely on services.
     * @param cls
     */
    public findReference(cls: any) {
        const meta: ReferredObjectMetadata = Reflect.getMetadata(Keys.RefMetaData, cls);
        if (!meta) throw new ReferenceError(`Reference to ${cls.constructor ? cls.constructor.name : cls.toString()} is not one of Service, Component, Singleton`);
        const allMeta = this.getAllReferredObjects();
        const found = allMeta.find(x => x.name === meta.name && x.type === meta.type);
        if (!found) throw new ReferenceError(`Unknown reference to ${meta.type} with name: ${meta.name}`);
        return found.ref;
    }

    /**
     * Injects all references.
     * @private
     */
    private async injectRefs(): Promise<void> {
        let ref: PendingReference;
        while ((ref = this.refs.shift())) {
            const f = this.findReference(isClass(ref.typeMeta) ? ref.typeMeta.constructor : ref.typeMeta);
            Object.defineProperty(ref.target, ref.key, {
                get() {
                    return f;
                },
                set() {
                    throw new SyntaxError("References cannot mutate state");
                }
            });
        }
        for (const c of this.components) await this.tryInit(c);
        for (const s of this.services) await this.tryInit(s);
    }

    private async tryInit(ref: ReferredObject): Promise<void> {
        try {
            this.emit("beforeInit", ref);
            await ref.ref.init?.();
            this.emit("afterInit", ref);
        } catch (e) {
            this.emit("initError", ref, e);
        }
    }

    /**
     * Recursively searches a directory and initialises all files (this does not call init)
     * @param dir The directory in which to search for files.
     * @private
     */
    private initialiseDirectory(dir: string): void {
        const files = Util.getFilesRecursively(dir, f => f.search(/\.(js|ts)$/) > -1, []);
        const pending: ReferredObject[] = [];
        for (const path of files) {
            const c = require(path);
            if (!c.default || !Reflect.getMetadata(Keys.RefMetaData, c.default)) continue;
            pending.push({
                ...Reflect.getMetadata(Keys.RefMetaData, c.default),
                ref: c.default,
            });
        }
        for (const r of pending.sort((a, b) => a.priority - b.priority)) {
            r.ref = new r.ref();
            switch (r.type) {
                case "component":
                    this.components.push(r);
                    break;
                case "service":
                    this.services.push(r);
                    break;
            }
        }
    }

    /**
     * Shutdown all components/services (i.e for read/write operations)
     * @private
     */
    private async shutdown(): Promise<void> {
        for (const c of this.components) await c.ref.shutdown?.();
        for (const s of this.services) await s.ref.shutdown?.();
    }

}
