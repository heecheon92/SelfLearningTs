export {}; // prevent global-scope type merging.

/**
 * Basic Case
 * */

type Person = {
  name: string;
  age: number;
};

let p1: Person = {
  name: "Alice",
  age: 30,
};

let p2: Person = {
  name: "Bob",
  age: 35,
};

function updatePerson_Invalid(key: keyof Person) {
  /**
   * The following line will throw an error:
   *    "Type 'string | number' is not assignable to type 'never'."
   *
   * This is because TypeScript compiler is unable to determine the type of the value.
   * tsc thinks "p1["name"] = p2["age"] (string = number)" can potentially occur,
   * thereby assuming the type of key is "string & number" which results in "never".
   * */
  p1[key] = p2[key];
}

function updatePerson_Valid<K extends keyof Person>(key: K) {
  p1[key] = p2[key];
}

/**
 * Another Case
 * */
type FirstFormFields = {
  age: {
    value: number;
    validator: (val: number) => boolean;
  };
  name: {
    value: string;
    validator: (val: string) => boolean;
  };
};

function validate_Invalid<K extends keyof FirstFormFields>(
  key: K,
  forms: FirstFormFields
) {
  forms["age"].validator(forms["age"].value); // <-- pass
  forms["name"].validator(forms["name"].value); // <-- pass

  /**
   * TypeScript's inference logic goes as below:
   *    forms[key].value is "number | string"
   *    forms[key].validator is "(val: number) => boolean | (val: string) => boolean"
   *
   * For "forms[key].validator(forms[key].value)" expression to work,
   * the validator should be "(val: number | string) => boolean" which confuses the
   * compiler. Is forms[key].validator equates to
   *    1. "(val: number) => boolean | (val: string) => boolean" or
   *    2. "(val: number | string) => boolean" ?
   * To work with either case, the compiler assumes that the type of validator is
   *    "(val: number & string) => boolean" which results in "never".
   */
  forms[key].validator(forms[key].value); // <-- 💥 TS2345
}

type Form<T> = {
  value: T;
  validator: (val: T) => boolean;
};

type SecondFormFields = {
  age: Form<number>;
  name: Form<string>;
};

function validate_Valid<K extends keyof SecondFormFields>(
  key: K,
  forms: SecondFormFields
) {
  forms["age"].validator(forms["age"].value); // <-- pass
  forms["name"].validator(forms["name"].value); // <-- pass

  forms[key].validator(forms[key].value); // <-- error

  const validate = <T>(form: Form<T>) => {
    form.validator(form.value);
  };
  const form = forms[key];
  validate(forms[key]); // Still confused
  validate(forms[key] as Form<typeof form.value>); // OK
}

/**
 * Related Discussion:
 *   - https://github.com/microsoft/TypeScript/pull/30769
 *   - https://github.com/microsoft/TypeScript/issues/30581
 *   - https://github.com/microsoft/TypeScript/issues/31445
 *   - https://github.com/microsoft/TypeScript/issues/35695
 *   - https://github.com/microsoft/TypeScript/issues/35613
 *   - https://oida.dev/typescript-unexpected-intersections/#ambiguous-functions
 * */
