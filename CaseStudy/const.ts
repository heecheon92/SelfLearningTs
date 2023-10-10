type Person = {
    name: string,
    age: number,
    account: {
        id: string,
        password: string,
        permission: {
            role: string,
            level: number,
            access: {facility: string}[]
        }
    }
}

type ShallowReadonly<T> = {
    readonly [K in keyof T]: T[K]
}

type NestedReadonly<T> = {
    readonly [K in keyof T]: T[K] extends infer R ? {
        readonly [K2 in keyof R]: R[K2]
    } : never
}

type DeepReadonly<T> = {
    readonly [K in keyof T] : T[K] extends infer R ? {
        readonly [K2 in keyof R]: DeepReadonly<R[K2]>
    }: never
}

const ____________raw: Person = {
    name: "raw",
    age: 30,
    account: {
        id: "eee",
        password: "qwerasdf",
        permission: {
            role: "freeToChange",
            level: 0,
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    }
}

const _____superConst = { 
    name: "a",
    age: 5,
    account: { 
        id: "www",
        password: "!Abcd12345",
        permission: {
            role: "normal",
            level: 1,
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    } 
} as const

// _____superConst 마찬가지로 as const 이지만 
// satisfies Person 표현을 통해 강제로 Person type에 
// 끼워 맞출경우 constSatisfiesPerson access는 readonly array 이지만
// Person type의 access는 mutable array 이므로 끼워 맞출수가 없다.
const constSatisfiesPerson = { 
    name: "a",
    age: 5,
    account: { 
        id: "www",
        password: "!Abcd12345",
        permission: {
            role: "normal",
            level: 1,
            // The type 'readonly [
            // { readonly facility: "lab"; },
            // { readonly facility: "elevator"; },
            // { readonly facility: "restricted"; }]'
            // is 'readonly' and cannot be assigned to the mutable type '{ facility: string; }[]'.
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    } 
} as const satisfies Person

const ___shallowConst: ShallowReadonly<Person> = {
    name: "b",
    age: 10,
    account: {
        id: "bbb",
        password: "12345QQ",
        permission: {
            role: "normal",
            level: 2,
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    }
}

const tsReadonlyConst: Readonly<Person> = {
    name: "b",
    age: 10,
    account: {
        id: "bbb",
        password: "12345QQ",
        permission: {
            role: "normal",
            level: 2,
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    }
}

const ____nestedConst: NestedReadonly<Person> = {
    name: "c",
    age: 15,
    account: {
        id: "ccc",
        password: "--1123",
        permission: {
            role: "master",
            level: 1,
            access: [
                {facility: "lab"},
                {facility: "elevator"},
                {facility: "restricted"}
            ]
        }
    }
}

const ______deepConst: DeepReadonly<Person> = {
    name: "d",
    age: 15,
    account: {
        id: "ddd",
        password: "--1123",
        permission: {
            role: "master",
            level: 2,
            access: [{facility: "lab"}, {facility: "elevator"}, {facility: "restricted"}]
        }
    }
}

____________raw.name = "raw2"        // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.name = "a2"          // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.name = "b2"          // Error, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.name = "b2"          // Error, const, 오브젝트 내부 루트 필드값만 수정 불가능 (Typescript 기본 제공 Readonly<T>)
____nestedConst.name = "c2"          // Error, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.name = "d2"          // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account = { ...____________raw.account, id: "someId", password: "somePassword" } // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.account = { ..._____superConst.account, id: "someId", password: "somePassword" } // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.account = { ...___shallowConst.account, id: "someId", password: "somePassword" } // Error, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.account = { ...tsReadonlyConst.account, id: "someId", password: "somePassword" } // Error, const, 오브젝트 내부 루트 필드값만 수정 불가능 
____nestedConst.account = { ...____nestedConst.account, id: "someId", password: "somePassword" } // Error, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.account = { ...______deepConst.account, id: "someId", password: "somePassword" } // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account.id = "newId" // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.account.id = "newId" // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.account.id = "newId" // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.account.id = "newId" // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능 
____nestedConst.account.id = "newId" // Error, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.account.id = "newId" // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능 
____nestedConst.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // Error, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.account.permission = { role: "newRole", level: 999, access: [{facility: "restricted"}] } // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // OK, const but 오브젝트 내부 필드값이 수정 가능

_____superConst.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)

___shallowConst.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능

tsReadonlyConst.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능 

____nestedConst.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // OK, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 

______deepConst.account.permission.access = [
    {facility: "lab"},
    {facility: "elevator"},
    {facility: "restricted"}
] // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account.permission.access.push({facility: "gym"}) // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.account.permission.access.push({facility: "gym"}) // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.account.permission.access.push({facility: "gym"}) // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.account.permission.access.push({facility: "gym"}) // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능 
____nestedConst.account.permission.access.push({facility: "gym"}) // OK, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.account.permission.access.push({facility: "gym"}) // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능

____________raw.account.permission.access[0].facility = "cafe" // OK, const but 오브젝트 내부 필드값이 수정 가능
_____superConst.account.permission.access[0].facility = "cafe" // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능 (DeepReadonly)
___shallowConst.account.permission.access[0].facility = "cafe" // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능
tsReadonlyConst.account.permission.access[0].facility = "cafe" // OK, const, 오브젝트 내부 루트 필드값만 수정 불가능 
____nestedConst.account.permission.access[0].facility = "cafe" // OK, const, 오브젝트 내부 루트 및 1단계 아래 필드값만 수정 불가능 
______deepConst.account.permission.access[0].facility = "cafe" // Error, const, 오브젝트 내부 루트 및 하위 필드값 수정 불가능
