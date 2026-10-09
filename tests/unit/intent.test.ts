import { describe, expect, it } from "vitest";
import { understandQuery } from "@/lib/knowledge/intent";

const intent = (text: string) => {
  const { kind, focus, target } = understandQuery(text);
  return { kind, focus, target };
};

describe("understanding a question", () => {
  it("finds the word in a definition question, whichever way it is put", () => {
    for (const q of [
      "what does afternoon mean",
      "What does afternoon mean?",
      "what does the word afternoon mean?",
      "what is the meaning of afternoon",
      "meaning of afternoon",
      "afternoon meaning",
      "define afternoon",
      "definition of afternoon",
      "what is meant by afternoon",
      "what is afternoon",
      "What's \"afternoon\"?",
    ]) {
      expect(intent(q), q).toEqual({ kind: "define", focus: "afternoon", target: null });
    }
  });

  it("keeps phrases together", () => {
    expect(intent("what does ice cream mean?").focus).toBe("ice cream");
    expect(intent("what is a quadratic equation?").focus).toBe("quadratic equation");
    expect(intent("define the term compound interest").focus).toBe("compound interest");
  });

  it("recognises translation questions and the language asked for", () => {
    expect(intent("how do you say afternoon in Spanish")).toEqual({ kind: "translate", focus: "afternoon", target: "es" });
    expect(intent("how to say good morning in Spanish?")).toEqual({ kind: "translate", focus: "good morning", target: "es" });
    expect(intent("afternoon in Spanish")).toEqual({ kind: "translate", focus: "afternoon", target: "es" });
    expect(intent("what is la tarde in English?")).toEqual({ kind: "translate", focus: "la tarde", target: "en" });
    expect(intent("Spanish for afternoon")).toEqual({ kind: "translate", focus: "afternoon", target: "es" });
    expect(intent("what is the Spanish word for dog")).toEqual({ kind: "translate", focus: "dog", target: "es" });
    expect(intent("translate afternoon to Spanish")).toEqual({ kind: "translate", focus: "afternoon", target: "es" });
    expect(intent("translate afternoon")).toEqual({ kind: "translate", focus: "afternoon", target: null });
    expect(intent("afternoon translation")).toEqual({ kind: "translate", focus: "afternoon", target: null });
  });

  it("does not take a mention of a language for a translation request", () => {
    expect(understandQuery("I like Spanish").kind).toBe("general");
    expect(understandQuery("learn Spanish").kind).toBe("general");
    expect(understandQuery("Spanish").kind).toBe("general");
  });

  it("recognises comparisons and their two sides", () => {
    const q = understandQuery("what is the difference between speed and velocity?");
    expect(q.kind).toBe("compare");
    expect(q.sides).toEqual(["speed", "velocity"]);
    expect(understandQuery("mitosis vs meiosis").sides).toEqual(["mitosis", "meiosis"]);
    expect(understandQuery("compare weather and climate").sides).toEqual(["weather", "climate"]);
  });

  it("recognises examples, how and why", () => {
    expect(intent("give me an example of a metaphor")).toEqual({ kind: "example", focus: "a metaphor", target: null });
    expect(intent("use although in a sentence")).toEqual({ kind: "example", focus: "although", target: null });
    expect(intent("how do I use the present perfect")).toEqual({ kind: "example", focus: "the present perfect", target: null });
    expect(intent("how does photosynthesis work?")).toEqual({ kind: "how", focus: "photosynthesis", target: null });
    expect(intent("why is the sky blue")).toEqual({ kind: "why", focus: "the sky blue", target: null });
  });

  it("strips polite lead-ins from an ordinary topic", () => {
    expect(intent("please explain photosynthesis")).toEqual({ kind: "general", focus: "photosynthesis", target: null });
    expect(intent("can you tell me about the French Revolution?")).toEqual({ kind: "general", focus: "the French Revolution", target: null });
    expect(intent("I want to understand quadratic equations")).toEqual({ kind: "general", focus: "quadratic equations", target: null });
  });

  it("does not mistake another question for a topic with the word 'mean'", () => {
    // "the mean" is a topic (statistics), so it is searched; but it is not read as "<question> mean".
    const q = understandQuery("what is the mean");
    expect(q.kind).toBe("define");
    expect(q.focus).toBe("mean");
    expect(understandQuery("what does mean").kind).not.toBe("translate");
  });

  it("marks a word or short phrase on its own as a look-up", () => {
    expect(understandQuery("afternoon").bare).toBe(true);
    expect(understandQuery("ice cream").bare).toBe(true);
    expect(understandQuery("la tarde").bare).toBe(true);
    expect(understandQuery("why do leaves change colour in autumn").bare).toBe(false);
    expect(understandQuery("afternoon?").bare).toBe(false);
  });

  it("understands Georgian questions", () => {
    expect(intent("რას ნიშნავს ძალა?")).toEqual({ kind: "define", focus: "ძალა", target: null });
    expect(intent("რა არის ფოტოსინთეზი")).toEqual({ kind: "define", focus: "ფოტოსინთეზი", target: null });
    expect(intent("რა არის ძალის მნიშვნელობა")).toEqual({ kind: "define", focus: "ძალის", target: null });
    expect(intent("განმარტე ენერგია")).toEqual({ kind: "define", focus: "ენერგია", target: null });
    expect(intent("როგორ ითარგმნება გამარჯობა ესპანურად")).toEqual({ kind: "translate", focus: "გამარჯობა", target: "es" });
    expect(intent("მადლობა ესპანურად")).toEqual({ kind: "translate", focus: "მადლობა", target: "es" });
    expect(understandQuery("განსხვავება სიჩქარესა და სიმძიმეს შორის").sides).toEqual(["სიჩქარესა", "სიმძიმეს"]);
    expect(understandQuery("განსხვავება მიტოზსა და მეიოზს შორის").kind).toBe("compare");
    expect(understandQuery("რა განსხვავებაა მიტოზი და მეიოზი შორის").sides).toEqual(["მიტოზი", "მეიოზი"]);
    expect(intent("როგორ მუშაობს ფოტოსინთეზი")).toEqual({ kind: "how", focus: "ფოტოსინთეზი", target: null });
    expect(intent("რატომ არის ცა ლურჯი")).toEqual({ kind: "why", focus: "არის ცა ლურჯი", target: null });
    expect(intent("ამიხსენი ფოტოსინთეზი")).toEqual({ kind: "general", focus: "ფოტოსინთეზი", target: null });
  });

  it("never returns an empty focus", () => {
    for (const q of ["?", "what is", "  ", "define", "რას ნიშნავს"]) expect(understandQuery(q).focus.length, JSON.stringify(q)).toBeGreaterThanOrEqual(0);
    expect(understandQuery("define").focus).toBe("define");
    expect(understandQuery("what is").focus).toBe("what is");
  });
});
