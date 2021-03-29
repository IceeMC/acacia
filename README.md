# Acacia

A simple application framework for personal use.

# Usage
```ts
import {Application} from "@winterfoxxo/acacia";

const app = new Application({
    componentDir: __dirname,
    serviceDir: __dirname
});
app.load().then(() => console.log("Application loaded!"));
```

# Components/Services

```ts
import {Service, Component, Ref} from "@winterfoxxo/acacia";

// services/MyService.ts
@Service("myService", 1)
export default class MyService {
}

// components/MyComponent.ts

@Component("myComponent", 1)
export default class MyComponent {
    @Ref public myService: MyService;
    init() {
        console.log(this.myService); // MyService {}
    }
}
```
