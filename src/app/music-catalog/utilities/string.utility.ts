export class StringUtility {
    public static capitalize(input: string): string {
        return input.charAt(0).toUpperCase() + input.slice(1);
    }
}
